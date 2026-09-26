"""
Deep Learning Rainfall Nowcasting Module (Stretch Goal).

Implements a recurrent neural network (GRU) that accepts 24 hours of meteorological
time-series sequences:
    [rainfall_mm, relative_humidity_pct, barometric_pressure_hpa]
and forecasts precipitation accumulation for the subsequent 6 hours:
    [rainfall_1h_mm, rainfall_2h_mm, rainfall_3h_mm, rainfall_4h_mm, rainfall_5h_mm, rainfall_6h_mm]

This nowcast can be used to forward-simulate flash flood risk or enrich the
XGBoost feature set with proactive forward-looking precipitation metrics.
"""

import os
import argparse
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

DEFAULT_NOWCASTER_PATH = os.path.join(os.path.dirname(__file__), "models", "nowcaster_gru.pt")

class RainfallNowcasterGRU(nn.Module):
    """
    2-Layer Gated Recurrent Unit (GRU) for sequential rainfall nowcasting.
    Input shape: (batch_size, 24, 3) -> 24 timesteps, 3 channels (Rain, RH, Pressure)
    Output shape: (batch_size, 6) -> 6-hour cumulative rainfall forecast
    """
    def __init__(self, input_dim: int = 3, hidden_dim: int = 64, num_layers: int = 2, output_dim: int = 6):
        super(RainfallNowcasterGRU, self).__init__()
        self.gru = nn.GRU(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.1 if num_layers > 1 else 0.0
        )
        self.head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, output_dim),
            nn.Softplus()  # Enforces strictly non-negative rainfall accumulation
        )

    def forward(self, x):
        # x: (batch_size, 24, 3)
        out, _ = self.gru(x)
        # Take final hidden state output
        last_step = out[:, -1, :]
        preds = self.head(last_step)
        return preds

class SyntheticWeatherSequenceDataset(Dataset):
    """
    Generates synthetic 24h weather sequences with diurnal cycles, convective spikes,
    and associated future 6-hour rainfall ground truth for training the nowcaster.
    """
    def __init__(self, n_sequences: int = 2500, seed: int = 42):
        rng = np.random.RandomState(seed)
        self.data = []
        self.targets = []

        for _ in range(n_sequences):
            # 24h past sequence
            # Rain (0 to 40 mm/hr, with probability of storm burst)
            is_burst = rng.rand() < 0.15
            hours = np.arange(24)
            # Diurnal humidity cycle (60% to 98% in monsoon)
            rh = 75.0 + 15.0 * np.sin(2 * np.pi * (hours - 4) / 24) + rng.normal(0, 3, 24)
            rh = np.clip(rh, 45.0, 99.0)

            # Pressure in mountain catchment (hPa, ~800 to 950 hPa, drops before storm)
            base_pressure = 860.0 + rng.normal(0, 15)
            pressure_drop = -8.0 if is_burst else rng.normal(0, 2)
            pressure = base_pressure + np.linspace(0, pressure_drop, 24) + rng.normal(0, 1, 24)

            # Rain sequence
            rain = np.zeros(24)
            if is_burst:
                burst_start = rng.randint(14, 20)
                rain[burst_start:] = rng.exponential(scale=12.0, size=24 - burst_start)
            else:
                rain = rng.choice([0.0, 0.5, 2.0, 5.0], size=24, p=[0.7, 0.15, 0.1, 0.05])

            seq = np.stack([rain, rh, pressure], axis=-1)  # (24, 3)

            # Future 6 hours target (cumulative 1h, 2h, 3h, 4h, 5h, 6h rain)
            if is_burst:
                future_hourly = rng.exponential(scale=14.0, size=6)
            else:
                future_hourly = rng.choice([0.0, 1.0, 3.0], size=6, p=[0.75, 0.18, 0.07])
            target_cumulative = np.cumsum(future_hourly)

            self.data.append(seq.astype(np.float32))
            self.targets.append(target_cumulative.astype(np.float32))

        self.data = np.array(self.data)
        self.targets = np.array(self.targets)

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return torch.tensor(self.data[idx]), torch.tensor(self.targets[idx])

def train_nowcaster(output_path: str = DEFAULT_NOWCASTER_PATH, epochs: int = 12):
    """
    Trains the PyTorch GRU nowcaster and saves model weights.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    dataset = SyntheticWeatherSequenceDataset(n_sequences=2000, seed=42)
    loader = DataLoader(dataset, batch_size=32, shuffle=True)

    model = RainfallNowcasterGRU()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.003, weight_decay=1e-4)
    criterion = nn.HuberLoss(delta=2.0)

    print(f"Training Rainfall Nowcaster GRU for {epochs} epochs...")
    model.train()
    for ep in range(epochs):
        total_loss = 0.0
        for x_batch, y_batch in loader:
            optimizer.zero_grad()
            preds = model(x_batch)
            loss = criterion(preds, y_batch)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * len(x_batch)

        mean_loss = total_loss / len(dataset)
        if (ep + 1) % 4 == 0 or ep == epochs - 1:
            print(f"  Epoch [{ep+1}/{epochs}] - Huber Loss: {mean_loss:.4f}")

    torch.save(model.state_dict(), output_path)
    print(f"Saved nowcaster weights to {output_path}")
    return model

def predict_nowcast(sequence_24x3: np.ndarray, model_path: str = DEFAULT_NOWCASTER_PATH) -> dict:
    """
    Given a (24, 3) numpy array or list of past 24h readings [rain_mm, rh_pct, pressure_hpa],
    returns 1h to 6h forecasted precipitation accumulation.
    """
    if not os.path.exists(model_path):
        train_nowcaster(model_path, epochs=10)

    model = RainfallNowcasterGRU()
    model.load_state_dict(torch.load(model_path, map_location=torch.device("cpu"), weights_only=True))
    model.eval()

    arr = np.array(sequence_24x3, dtype=np.float32)
    if arr.shape != (24, 3):
        raise ValueError(f"Expected input sequence of shape (24, 3), got {arr.shape}")

    tensor_input = torch.tensor(arr).unsqueeze(0)  # (1, 24, 3)
    with torch.no_grad():
        preds = model(tensor_input).squeeze(0).numpy()

    return {
        "forecast_1h_mm": round(float(preds[0]), 2),
        "forecast_2h_mm": round(float(preds[1]), 2),
        "forecast_3h_mm": round(float(preds[2]), 2),
        "forecast_4h_mm": round(float(preds[3]), 2),
        "forecast_5h_mm": round(float(preds[4]), 2),
        "forecast_6h_mm": round(float(preds[5]), 2),
        "total_forecast_6h_mm": round(float(preds[5]), 2)
    }

def enrich_features_with_nowcast(base_features: dict, sequence_24x3: np.ndarray) -> dict:
    """
    Helper function showing how nowcasted rainfall can enrich the baseline feature dictionary.
    Adds 'nowcasted_future_rainfall_6h_mm' without breaking downstream compatibility.
    """
    forecast = predict_nowcast(sequence_24x3)
    enriched = dict(base_features)
    enriched["nowcasted_future_rainfall_6h_mm"] = forecast["total_forecast_6h_mm"]
    return enriched

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", action="store_true", help="Train nowcaster model")
    parser.add_argument("--demo", action="store_true", help="Run demonstration inference")
    args = parser.parse_args()

    if args.train:
        train_nowcaster()
    elif args.demo:
        # Sample synthetic 24h weather history
        sample_seq = np.zeros((24, 3))
        # Afternoon storm buildup
        sample_seq[:, 0] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1.2, 3.5, 8.0, 15.0, 22.0, 18.0, 12.0, 8.0, 4.0, 2.0, 1.0, 0, 0, 0, 0]
        sample_seq[:, 1] = np.linspace(65, 95, 24)  # Rising humidity
        sample_seq[:, 2] = np.linspace(880, 868, 24)  # Falling pressure
        res = predict_nowcast(sample_seq)
        print("Nowcast 6-Hour Precipitation Forecast:")
        for k, v in res.items():
            print(f"  {k}: {v} mm")
    else:
        # Train by default if model does not exist
        if not os.path.exists(DEFAULT_NOWCASTER_PATH):
            train_nowcaster()
