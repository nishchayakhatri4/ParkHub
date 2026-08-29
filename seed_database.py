"""Import the supplied CSV files. Requires SUPABASE_SERVICE_ROLE_KEY."""

import csv
from pathlib import Path

from database import request


ROOT = Path(__file__).parent


def rows(name):
    with (ROOT / name).open(encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def main():
    accounts = []
    profiles = []
    for role, filename in (("user", "Users.txt"), ("owner", "Owners.txt")):
        for row in rows(filename):
            accounts.append({
                "role": role, "first_name": row["First Name"],
                "last_name": row["Last Name"], "email": row["Email"].lower(),
                "password_hash": row["Password"],
            })
    saved = request("accounts?on_conflict=email", method="POST", body=accounts, service=True)
    ids = {account["email"]: account["id"] for account in saved}
    for row in rows("Users.txt"):
        profiles.append({"account_id": ids[row["Email"].lower()],
                         "license_plate": row["License Plate"], "car_model": row["Car Model"]})
    request("user_profiles?on_conflict=account_id", method="POST", body=profiles, service=True)
    garages = []
    for row in rows("garages.txt"):
        garages.append({
            "parking_id": row["ParkingID"], "owner_id": ids[row["OwnerEmail"].lower()],
            "parking_name": row["ParkingName"], "location": row["Location"],
            "address": row["Address"], "hourly_rate": row["HourlyRate"].lstrip("$"),
            "score": row["Score"], "is_open": row["IsOpen"].lower() == "true",
            "latitude": row["Latitude"], "longitude": row["Longitude"],
        })
    request("garages?on_conflict=parking_id", method="POST", body=garages, service=True)
    print(f"Imported {len(accounts)} accounts and {len(garages)} garages.")


if __name__ == "__main__":
    main()

