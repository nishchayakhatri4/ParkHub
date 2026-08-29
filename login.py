from database import DatabaseError, login
MAX_ATTEMPTS = 3

# Correct general-user credential: bob@example.com / 1234
# Correct owner credential: olivia.owner@example.com / owner123


def main() -> None:
    for attempt in range(1, MAX_ATTEMPTS + 1):
        account_type = input("Account type (user/owner): ").strip().lower()
        email = input("Email: ").strip().lower()
        password = input("Password: ")
        try:
            account = login(account_type, email, password)
        except DatabaseError as error:
            print(error)
            return
        if account:
            name = account["first_name"]
            role = "general user" if account_type == "user" else "owner"
            print(f"Access granted. Welcome, {name}! Signed in as {role}.")
            try:
                if account_type == "owner":
                    from owner import main as open_owner_menu

                    open_owner_menu(account["session_token"])
                else:
                    print("Opening the parking map...\n")
                    from map import main as open_parking_map

                    open_parking_map()
            except ImportError as error:
                print(f"Unable to start the requested program: {error}")
            return

        remaining = MAX_ATTEMPTS - attempt
        if remaining:
            print(f"Invalid credentials. {remaining} attempt(s) remaining.\n")

    print("Access denied. Maximum login attempts reached.")


if __name__ == "__main__":
    main()
