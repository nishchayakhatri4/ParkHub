import webbrowser
from math import atan2, cos, radians, sin, sqrt
from pathlib import Path

import folium
from database import DatabaseError, list_garages


MAP_FILE = Path(__file__).with_name("garages_map.html")
SEARCH_POINTS = {
    "1": ("Sydney CBD", -33.8688, 151.2093),
    "2": ("Parramatta", -33.8150, 151.0011),
    "3": ("Bondi", -33.8915, 151.2767),
    "4": ("Newtown", -33.8981, 151.1770),
    "5": ("Manly", -33.7969, 151.2847),
}


def calculate_distance(lat1, lon1, lat2, lon2):
    """Return the great-circle distance between two points in kilometres."""
    earth_radius = 6371
    latitude_change = radians(lat2 - lat1)
    longitude_change = radians(lon2 - lon1)
    value = (
        sin(latitude_change / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2))
        * sin(longitude_change / 2) ** 2
    )
    return earth_radius * 2 * atan2(sqrt(value), sqrt(1 - value))


def load_garages():
    garages = list_garages()
    for garage in garages:
        garage["score"] = float(garage["score"])
        garage["latitude"] = float(garage["latitude"])
        garage["longitude"] = float(garage["longitude"])
        garage["hourly_rate"] = f"${float(garage['hourly_rate']):g}"
    return garages


def find_nearby_garages(garages, centre_latitude, centre_longitude, radius):
    results = []
    for garage in garages:
        if not garage["is_open"]:
            continue

        distance = calculate_distance(
            centre_latitude, centre_longitude,
            garage["latitude"], garage["longitude"],
        )
        if distance <= radius:
            result = garage.copy()
            result["distance"] = distance
            results.append(result)
    return sorted(results, key=lambda garage: garage["distance"])


def create_map(location_name, centre_latitude, centre_longitude, radius, garages,
               filename=MAP_FILE):
    garage_map = folium.Map(
        location=[centre_latitude, centre_longitude], zoom_start=13,
        control_scale=True,
    )
    folium.Marker(
        [centre_latitude, centre_longitude],
        tooltip=f"Search centre: {location_name}",
        popup=f"<b>{location_name}</b><br>Search centre",
        icon=folium.Icon(color="red", icon="home"),
    ).add_to(garage_map)
    folium.Circle(
        [centre_latitude, centre_longitude], radius=radius * 1000,
        color="blue", fill=True, fill_color="blue", fill_opacity=0.08,
        popup=f"Search radius: {radius:g} km",
    ).add_to(garage_map)

    marker_group = folium.FeatureGroup(name="Nearby garages").add_to(garage_map)
    for garage in garages:
        # Keep closed garages off the map even if this function is called directly.
        if not garage["is_open"]:
            continue

        popup_html = f"""
        <div style="width:260px">
          <h4>{garage['name']}</h4>
          <b>Parking ID:</b> {garage['parking_id']}<br>
          <b>Area:</b> {garage['location']}<br>
          <b>Address:</b> {garage['address']}<br>
          <b>Hourly rate:</b> {garage['hourly_rate']}<br>
          <b>Score:</b> {garage['score']:.1f}/5<br>
          <b>Distance:</b> {garage['distance']:.2f} km
        </div>"""
        folium.Marker(
            [garage["latitude"], garage["longitude"]],
            tooltip=f"{garage['name']} — {garage['distance']:.2f} km",
            popup=folium.Popup(popup_html, max_width=320),
            icon=folium.Icon(color="blue", icon="car", prefix="fa"),
        ).add_to(marker_group)

    folium.LayerControl().add_to(garage_map)
    garage_map.save(str(filename))
    return filename


def choose_search_point():
    print("\nSelect a search location:\n")
    for key, (name, _, _) in SEARCH_POINTS.items():
        print(f"{key}. {name}")
    print("6. Exit")

    while True:
        choice = input("\nChoose a location: ").strip()
        if choice == "6":
            return None
        if choice in SEARCH_POINTS:
            return SEARCH_POINTS[choice]
        print("Invalid location. Please choose 1 to 6.")


def ask_for_radius():
    while True:
        try:
            radius = float(input("Enter search radius in km: "))
            if radius > 0:
                return radius
        except ValueError:
            pass
        print("Please enter a number greater than 0.")


def main():
    try:
        garages = load_garages()
    except (DatabaseError, ValueError) as error:
        print(f"Unable to load garages: {error}")
        return

    selection = choose_search_point()
    if selection is None:
        print("Goodbye!")
        return

    location_name, centre_latitude, centre_longitude = selection
    radius = ask_for_radius()
    results = find_nearby_garages(
        garages, centre_latitude, centre_longitude, radius
    )

    print(f"\nGarages within {radius:g} km of {location_name}:")
    if not results:
        print("No garages found in this radius.")
    for number, garage in enumerate(results, start=1):
        print(f"\n{number}. {garage['name']}")
        print(f"   Parking ID: {garage['parking_id']}")
        print(f"   Distance: {garage['distance']:.2f} km")
        print(f"   Rate: {garage['hourly_rate']} per hour")
        print(f"   Score: {garage['score']:.1f}/5")
        print(f"   Address: {garage['address']}")

    output_file = create_map(
        location_name, centre_latitude, centre_longitude, radius, results
    )
    print(f"\nMapped {len(results)} garages.")
    print(f"Map saved as: {output_file}")
    webbrowser.open(output_file.resolve().as_uri())


if __name__ == "__main__":
    main()
