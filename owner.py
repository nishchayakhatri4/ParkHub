from database import DatabaseError, add_garage, owner_garages, remove_garage


def ask_number(prompt: str, minimum: float, maximum: float | None = None) -> float:
    while True:
        try:
            number = float(input(prompt).strip())
            if number >= minimum and (maximum is None or number <= maximum):
                return number
        except ValueError:
            pass
        limit = f" to {maximum:g}" if maximum is not None else " or greater"
        print(f"Enter a number from {minimum:g}{limit}.")


def ask_open_status() -> bool:
    while True:
        value = input("Is the parking open? (yes/no): ").strip().lower()
        if value in {"yes", "y"}:
            return True
        if value in {"no", "n"}:
            return False
        print("Please enter yes or no.")


def list_parkings(session_token: str):
    parkings = owner_garages(session_token)
    if not parkings:
        print("\nYou do not have any parkings.")
        return
    print("\nYour parkings:")
    for parking in parkings:
        print(f"- {parking['parking_id']}: {parking['parking_name']} ({parking['address']})")


def add_parking(session_token: str):
    values = {
        "p_parking_name": input("Parking name: ").strip(),
        "p_location": input("Area/location: ").strip(),
        "p_address": input("Address: ").strip(),
        "p_hourly_rate": ask_number("Hourly rate: $", 0),
        "p_score": ask_number("Score (0-5): ", 0, 5),
        "p_is_open": ask_open_status(),
        "p_latitude": ask_number("Latitude (-90 to 90): ", -90, 90),
        "p_longitude": ask_number("Longitude (-180 to 180): ", -180, 180),
    }
    if not all(values[key] for key in ("p_parking_name", "p_location", "p_address")):
        print("Parking name, location, and address are required.")
        return
    parking_id = add_garage(session_token, values)
    print(f"Parking {parking_id} was added.")


def main(session_token: str):
    while True:
        print("\nOwner parking management")
        print("1. List my parkings\n2. Add a parking\n3. Remove a parking")
        print("4. Open parking map\n5. Sign out")
        choice = input("Choose an option: ").strip()
        try:
            if choice == "1":
                list_parkings(session_token)
            elif choice == "2":
                add_parking(session_token)
            elif choice == "3":
                list_parkings(session_token)
                parking_id = input("\nParking ID to remove (or Enter to cancel): ").strip()
                if parking_id:
                    message = ("Parking removed." if remove_garage(session_token, parking_id)
                               else "That parking ID does not belong to your account.")
                    print(message)
            elif choice == "4":
                from map import main as open_parking_map
                open_parking_map()
            elif choice == "5":
                print("Signed out.")
                return
            else:
                print("Choose an option from 1 to 5.")
        except DatabaseError as error:
            print(f"Unable to update parking data: {error}")


if __name__ == "__main__":
    print("Please run login.py and authenticate as an owner.")
