from math import radians, sin, cos, sqrt, pi, atan2 # Použité matematické funkcie

"""
Technická univerzita v Košiciach
Fakulta elektrotechniky a informatiky
Katedra kybernetiky a umelej inteligencie

Zvyšovanie bezpečnosti integrácie dronov do leteckého priestoru - Bakalárska práca

Autor:
Štefan Kando

Vedúci práce:
doc. Ing. Peter Papcun, PhD.

2024
"""

"""
Súbor: check_breach.py
Funkcia na kontrolu narušenia zón s predpoveďou vývoja prevádzky
"""


# Bezpečný vertikálny odstup v metroch
vertical_overhead = 500


# Funkcia na kontrolu narušení zóny lietadlami
def check_aircraft_zone_violations(zone_info, settings, aircraft_data):
    """
    Funkcia na kontrolu narušení zóny lietadlami s predpoveďou vývoja prevádzky
    :param zone_info: Informácie o zóne, dictionary s kľúčmi 'lat', 'lng'
    :param settings: Nastavenia zóny, dictionary s kľúčmi 'flightRange' a 'warningOverhead'
    :param aircraft_data: Prijaté dáta o letovej prevádzke vo formáte aircraft.json
    :return: Zoznam narušení zón vo formáte 'hex kód lietadla', 'typ narušenia',
            'budúca výška v metroch', 'čas do narušenia v sekundách'
    """
    try:
        # Extrahovanie informácií o zóne a nastavení
        lat = zone_info['lat']
        lon = zone_info['lng']
        flight_range = settings['flightRange'] * 2
        warning_overhead = settings['flightRange'] + settings['warningOverhead'] * 2000  # WarningOverhead je v km, konvertuje na metre
        duration = settings['duration']
        altitude = settings['altitude']
    except KeyError:
        print("Key error")
        return

    # Funkcia na konverziu lat/lon na súradnice x/y
    def latlon_to_xy(lat, lon, center_lat, center_lng):
        R = 6371000  # polomer Zeme v metroch
        x = R * radians(lon - center_lng) * cos(radians(center_lat))
        y = R * radians(lat - center_lat)
        return x, y

    # Funkcia na predikciu budúcej polohy lietadla
    def predict_position(lat, lon, speed, track, duration):
        if speed is None:
            speed = 0
        speed_mps = speed * 0.514444  # konverzia z uzlov na metre za sekundu
        track_rad = radians(track)
        dx = speed_mps * duration * 60 * cos(track_rad)
        dy = speed_mps * duration * 60 * sin(track_rad)
        new_lat = lat + (dy / 6371000) * (180 / pi)
        new_lon = lon + (dx / (6371000 * cos(radians(lat)))) * (180 / pi)
        return new_lat, new_lon

    # Funkcia na kontrolu prieniku a času do prieniku
    def check_intersection_and_time(x0, y0, x1, y1, cx, cy, radius):
        # Kontrola, či je počiatočná poloha už v rádiuse
        if (x0 - cx) ** 2 + (y0 - cy) ** 2 <= radius ** 2:
            return True, 0  # Zóna je už porušená, vráti 0 sekúnd do prieniku

        # Pokračuje výpočtom času do potenciálneho budúceho prieniku
        dx = x1 - x0
        dy = y1 - y0
        fx = x0 - cx
        fy = y0 - cy
        a = dx * dx + dy * dy
        if a == 0:
            return False, None
        b = 2 * (fx * dx + fy * dy)
        c = (fx * fx + fy * fy) - radius * radius
        discriminant = b * b - 4 * a * c
        if discriminant >= 0:
            discriminant_sqrt = sqrt(discriminant)
            t1 = (-b - discriminant_sqrt) / (2 * a)
            t2 = (-b + discriminant_sqrt) / (2 * a)
            times = [t for t in (t1, t2) if 0 <= t <= 1]
            if times:
                return True, min(times) * duration * 60  # Konvertuje časový podiel na sekundy
        return False, None

    # Získanie zoznamu najbližších lietadiel
    # print(list_closest_aircraft(lat, lon, aircraft_data))

    violations = []  # Zoznam na uloženie narušení
    for ac in aircraft_data["aircraft"]:
        if 'lat' in ac and 'lon' in ac:
            try:
                speed = ac['gs']  # Rýchlosť
            except:
                speed = 1

            try:
                track = ac['track']  # Smer letu
            except:
                try:
                    track = ac['nav_heading']
                except:
                    try:
                        track = ac['mag_heading']
                    except:
                        track = 0

            # Predikcia budúcej polohy lietadla
            future_lat, future_lon = predict_position(ac['lat'], ac['lon'], speed, track, duration)
            x0, y0 = latlon_to_xy(ac['lat'], ac['lon'], lat, lon)
            x1, y1 = latlon_to_xy(future_lat, future_lon, lat, lon)

            # Kontrola narušení zóny letu a varovnej zóny
            flight_zone_breach, time_to_breach_flight = check_intersection_and_time(x0, y0, x1, y1, 0, 0, flight_range)
            warning_zone_breach, time_to_breach_warning = check_intersection_and_time(x0, y0, x1, y1, 0, 0,
                                                                                      warning_overhead)
            try:
                current_altitude = ac.get('alt_baro', 0) * 0.3048  # Konverzia z výšky v stopách na metre
                vertical_speed = ac.get('baro_rate', 0) * 0.3048 / 60  # Konverzia vertikálnej rýchlosti na metre za sekundu
                future_altitude = current_altitude + (vertical_speed * duration * 60)

                # Kontrola, či aktuálna alebo budúca nadmorská výška lietadla prekračuje definovanú výšku plus vertikálny odstup
                if current_altitude <= altitude + vertical_overhead or 0 <= future_altitude <= altitude + vertical_overhead:
                    # Ak došlo k narušeniu zóny letu
                    if flight_zone_breach:
                        # Pridanie narušenia do zoznamu s typom narušenia, budúcou výškou a časom do narušenia
                        violations.append((ac['hex'], 'Flight zone breach', future_altitude, time_to_breach_flight))
                    # Ak došlo k narušeniu varovnej zóny
                    elif warning_zone_breach:
                        # Pridanie narušenia do zoznamu s typom narušenia, budúcou výškou a časom do narušenia
                        violations.append(
                            (ac['hex'], 'Warning zone proximity', future_altitude, time_to_breach_warning))

            # Výnimka na zachytenie prípadných chýb pri výpočtoch
            except:
                # Ak došlo k narušeniu zóny letu, ale došlo k chybe pri výpočte výšky
                if flight_zone_breach:
                    # Pridanie narušenia do zoznamu s nulovou výškou a časom do narušenia
                    violations.append((ac['hex'], 'Flight zone breach', 0, time_to_breach_flight))
                # Ak došlo k narušeniu varovnej zóny, ale došlo k chybe pri výpočte výšky
                elif warning_zone_breach:
                    # Pridanie narušenia do zoznamu s nulovou výškou a časom do narušenia
                    violations.append((ac['hex'], 'Warning zone proximity', 0, time_to_breach_warning))

    return violations


# Funkcia na zobrazenie zoznamu najbližších lietadiel (nepoužívaná vo finálnej aplikácii)
def list_closest_aircraft(lat, lon, aircraft_data):
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371000  # Polomer Zeme v metroch
        phi1, phi2 = radians(lat1), radians(lat2)
        delta_phi = radians(lat2 - lat1)
        delta_lambda = radians(lon2 - lon1)
        a = sin(delta_phi / 2.0) ** 2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2.0) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c

    aircraft_distances = []
    for ac in aircraft_data['aircraft']:
        if 'lat' in ac and 'lon' in ac:
            distance = haversine(lat, lon, ac['lat'], ac['lon'])
            aircraft_distances.append((ac['hex'], distance))

    # Zoradenie podľa vzdialenosti
    aircraft_distances.sort(key=lambda x: x[1])

    return aircraft_distances
