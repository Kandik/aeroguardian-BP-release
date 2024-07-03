import requests  # Importuje knižnicu requests pre HTTP požiadavky
import psycopg2  # Importuje knižnicu psycopg2 pre prácu s PostgreSQL
from psycopg2.extras import execute_values  # Importuje execute_values pre efektívne vkladanie dát
import logging  # Importuje logging pre logovanie
from concurrent.futures import ThreadPoolExecutor  # Importuje ThreadPoolExecutor pre paralelné spracovanie
import numpy as np  # Importuje numpy pre numerické operácie

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
Súbor: fill_grid_height.py
Skript na naplnenie databázy s výškovými dátami
"""

# Nastavenie logovania
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# Vytvorenie a vrátenie spojenia s databázou
def create_connection(connection_parameters):
    return psycopg2.connect(**connection_parameters)


# Získanie nadmorskej výšky z lokálneho servera OpenTopoData
def get_elevation(lat, lon):
    url = f"http://your_opentopodata_server/v1/eudem25?locations={lat},{lon}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        height = round(data['results'][0]['elevation'], 2)
        return height
    except requests.RequestException as e:
        logging.error(f"Request failed for coordinates ({lat}, {lon}): {e}")
        return 0


# Vloženie dát o nadmorských výškach do databázy
def insert_elevation_data(connection_parameters, records, airport, resolution):
    if records:
        conn = create_connection(connection_parameters)
        cur = conn.cursor()
        execute_values(cur, f"INSERT INTO grid_ground_height_{airport}_{resolution} "
                            f"(lowLat, lowLon, groundHeight) VALUES %s ON CONFLICT "
                            f"(lowLat, lowLon) DO UPDATE SET groundHeight = EXCLUDED.groundHeight", records)
        conn.commit()
        cur.close()
        conn.close()
        logging.info(f"Inserted/Updated {len(records)} records into database.")


# Spracovanie jednej časti súradníc a získanie nadmorskej výšky
def process_patch(lat_start, lat_end, lon_start, lon_end, resolution):
    records = []
    for lat in np.arange(lat_start, lat_end, resolution):
        for lon in np.arange(lon_start, lon_end, resolution):
            center_lat = round(lat + resolution / 2, 5)
            center_lon = round(lon + resolution / 2, 5)
            elevation = get_elevation(center_lat, center_lon)
            if elevation is not None:
                records.append((round(lat, 5), round(lon, 5), elevation))
    return records


# Naplnenie databázy dátami o nadmorských výškach v paralelných úlohách
def fill_grid_ground_height(connection_parameters, lat_bounds, lon_bounds, resolution, airport, patch_size, max_workers):
    lat_start, lat_end = lat_bounds
    lon_start, lon_end = lon_bounds

    lat_patches = np.arange(lat_start, lat_end, patch_size)
    lon_patches = np.arange(lon_start, lon_end, patch_size)
    patches = [(lat_patch_start, min(lat_patch_start + patch_size, lat_end), lon_patch_start,
                min(lon_patch_start + patch_size, lon_end))
               for lat_patch_start in lat_patches for lon_patch_start in lon_patches]

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_patch, *patch, resolution) for patch in patches]
        for future in futures:
            records = future.result()
            if records:
                insert_elevation_data(connection_parameters, records, airport, resolution)


# Príklad použitia
if __name__ == '__main__':
    # Nastavenie parametrov pripojenia k databáze
    connection_parameters = {
        "host": "your_postgre_ip",
        "port": "your_postgre_port",
        "database": "your_postgre_database_name",
        "user": "your_postgre_username",
        "password": "your_postgre_password"
    }

    # Príklad použitia funkcie fill_grid_ground_height
    fill_grid_ground_height(connection_parameters, (48.5, 49), (21, 21.5), 1/2000, "lzkz", 0.02, max_workers=4)
    # Špecifikácia hraníc zemepisnej šírky/dĺžky, rozlíšenia a veľkosti časti na spracovanie
