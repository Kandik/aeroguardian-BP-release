import requests  # Importuje knižnicu requests pre HTTP požiadavky
import json  # Importuje knižnicu json pre prácu s JSON súbormi
import psycopg2  # Importuje knižnicu psycopg2 pre prácu s PostgreSQL
from datetime import datetime, timedelta  # Importuje datetime a timedelta pre prácu s dátumom a časom
import time  # Importuje knižnicu time pre časové operácie
import logging  # Importuje logging pre logovanie
from pathlib import Path  # Importuje Path pre prácu s cestami k súborom

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
Súbor: logger.py
Skript na priebežné logovanie zachytených dát do PostgreSQL, využívajúci tabuľku 'sources'
"""

# Parametre pripojenia k databáze
connection_parameters = {
    "host": "your_postgre_ip",
    "port": "your_postgre_port",
    "database": "your_postgre_database_name",
    "user": "your_postgre_username",
    "password": "your_postgre_password"
}

# Základný adresár pre ukladanie JSON záloh
BASE_DIR = Path('/path/to/save/JSON/backups')

# Nastavenie denného režimu (hodiny od-do vrátane)
day = (6, 21)


# Funkcia na vytvorenie dennej partície v databáze
def create_daily_partition(conn, date_str):
    partition_name = f"aircraft_pointcloud_{date_str}"
    try:
        with conn.cursor() as cur:
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {partition_name}
                PARTITION OF aircraft_pointcloud
                FOR VALUES FROM (%s) TO (%s);
            """, (f'{date_str} 00:00:00', f'{date_str} 23:59:59'))
            conn.commit()
        logging.info(f"Partition {partition_name} created or verified.")
    except Exception as e:
        logging.error(f"Failed to create partition {partition_name}: {e}")


# Funkcia na získanie zdrojov z databáze
def fetch_sources(conn):
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT source_id, receiver_name, receiver_website FROM sources;")
            return cur.fetchall()
    except Exception as e:
        logging.error("Failed to fetch sources: {0}".format(e))
        return []


# Funkcia na získanie JSON dát zo zdroja
def fetch_json_from_source(url):
    try:
        response = requests.get(url)
        return response.json()
    except requests.RequestException as e:
        logging.error("Failed to fetch data from {0}: {1}".format(url, e))
        return None


# Funkcia na získanie existujúcich stĺpcov v databáze
def fetch_existing_columns(conn):
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='aircraft_pointcloud';")
            return {row[0] for row in cur.fetchall()}
    except Exception as e:
        logging.error(f"Failed to fetch existing columns: {e}")
        return set()


# Funkcia na pridanie nového stĺpca, ak neexistuje
def add_column_if_not_exists(conn, existing_columns, column_name):
    if column_name not in existing_columns:
        try:
            with conn.cursor() as cur:
                cur.execute(f"ALTER TABLE aircraft_pointcloud ADD COLUMN {column_name} TEXT;")
                existing_columns.add(column_name)
                conn.commit()
            logging.info(f"Added new column '{column_name}'.")
        except Exception as e:
            logging.error(f"Failed to add column '{column_name}': {e}")


# Funkcia na spracovanie dát z JSON
def process_data(data, conn, existing_columns, date_str, source_id):
    logging.info("Processing data for source_id: {source_id}")
    partition_name = f"aircraft_pointcloud_{date_str.replace('-', '')}"

    try:
        if "now" in data:  # Zabezpečí, že timestamp "now" je prítomný
            capture_time = datetime.fromtimestamp(data["now"])

            for aircraft in data.get("aircraft", []):
                columns = ['capture_time', 'hex_code', 'source_id']  # Inicializuje s povinnými stĺpcami
                values = [capture_time, aircraft.get("hex", "unknown"), source_id]

                for key, value in aircraft.items():
                    if key not in ['hex', 'capture_time']:  # Preskočí už spracované kľúče
                        if key + "_num" in existing_columns:
                            process_numeric_value(key, value, columns, values)
                        else:
                            if key not in existing_columns:
                                add_column_if_not_exists(conn, existing_columns, key)
                            columns.append(key)
                            values.append(value)

                insert_query = f"INSERT INTO {partition_name} ({', '.join(columns)}) " \
                               f"VALUES ({', '.join(['%s'] * len(values))}) " \
                               f"ON CONFLICT (source_id, capture_time, hex_code) DO NOTHING"

                with conn.cursor() as cur:
                    cur.execute(insert_query, tuple(values))
                conn.commit()
    except Exception as e:
        logging.error(f"Failed to process data for source_id {source_id}: {e}")
        if conn:
            conn.rollback()


# Funkcia na spracovanie numerických hodnôt
def process_numeric_value(key, value, columns, values):
    num_key = key + "_num"
    if key in ['alt_baro', 'alt_geom'] and value == 'ground':
        num_value = 0
    elif value is not None:
        try:
            num_value = float(value)
        except ValueError:
            num_value = None
    else:
        num_value = None

    if num_value is not None:
        if num_key not in columns:
            columns.append(key)
            values.append(value)
            columns.append(num_key)
            values.append(num_value)


# Hlavná funkcia skriptu
def main():
    logging.basicConfig(level=logging.INFO)
    conn = psycopg2.connect(**connection_parameters)

    # Pôvodne nastaví last_processed_day na None, aby sa zabezpečilo vytvorenie partície pri prvom spustení
    last_processed_day = None

    while True:
        current_dt = datetime.now()
        current_day_str = current_dt.strftime('%Y%m%d')
        current_hour = current_dt.hour
        # Toto zabezpečí, že nová partícia sa vytvorí na začiatku nového dňa
        if last_processed_day != current_day_str:
            create_daily_partition(conn, current_day_str)
            last_processed_day = current_day_str
        next_hour = (current_dt + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)

        day_dir = BASE_DIR / current_day_str
        day_dir.mkdir(parents=True, exist_ok=True)

        hourly_file = day_dir / f"aircraft_{current_hour:02}.json"
        if not hourly_file.exists():
            hourly_file.touch()

        sources = fetch_sources(conn)
        existing_columns = fetch_existing_columns(conn)

        while datetime.now() < next_hour:
            for source_id, _, website in sources:
                # Opraviť URL adresu, ak je potrebné
                url = f"{website}/data/aircraft.json"

                data = fetch_json_from_source(url)
                if data:
                    # Pridať source_id do dát pred ich uložením do súboru
                    data['source_id'] = source_id
                    with open(hourly_file, 'a') as file:
                        json.dump(data, file)
                        file.write('\n')

                    process_data(data, conn, existing_columns, current_day_str, source_id)

            # Určenie trvania spánku na základe aktuálnej hodiny (noc vs. deň)
            sleep_duration = 20 if day[1] <= current_hour or current_hour < day[0] else 5
            time.sleep(sleep_duration)


if __name__ == "__main__":
    main()
