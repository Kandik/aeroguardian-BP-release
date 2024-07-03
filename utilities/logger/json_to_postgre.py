import json  # Importuje knižnicu json pre prácu s JSON súbormi
import psycopg2  # Importuje knižnicu psycopg2 pre prácu s PostgreSQL
from psycopg2.extensions import AsIs  # Importuje AsIs pre bezpečné vkladanie názvov stĺpcov
from pathlib import Path  # Importuje Path pre prácu s cestami k súborom
from datetime import datetime  # Importuje datetime pre prácu s dátumom a časom
import logging  # Importuje logging pre logovanie
from concurrent.futures import ThreadPoolExecutor  # Importuje ThreadPoolExecutor pre paralelné spracovanie

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
Súbor: json_to_postgre.py
Skript na presun dát z uložených aircraft.json súborov do PostgreSQL
"""

# Konfigurácia logovania
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


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


# Funkcia na spracovanie jednotlivého súboru
def process_file(file_path, conn, existing_columns, date_str):
    logging.info(f"Processing file: {file_path}")
    partition_name = f"aircraft_pointcloud_{date_str.replace('-', '')}"  # Predpokladá, že date_str je vo formáte 'YYYY-MM-DD'

    try:
        with open(file_path, 'r') as file:
            data = json.load(file)  # Načíta dáta zo súboru
        capture_time = datetime.fromtimestamp(data["now"])  # Konvertuje čas zachytenia na datetime

        for aircraft in data.get("aircraft", []):
            columns = ['capture_time', 'hex_code']
            values = [capture_time, aircraft.get("hex", "unknown")]
            for key, value in aircraft.items():
                if key not in ['hex', 'capture_time']:  # Vylúči kľúče, ktoré sú primárne kľúče
                    if key not in existing_columns:
                        add_column_if_not_exists(conn, existing_columns, key)  # Pridá nový stĺpec, ak neexistuje
                    columns.append(key)
                    values.append(value)

            insert_query = f"INSERT INTO {partition_name} ({', '.join(columns)}) VALUES ({', '.join(['%s']*len(values))}) ON CONFLICT (capture_time, hex_code) DO NOTHING;"
            with conn.cursor() as cur:
                cur.execute(insert_query, tuple(values))  # Vykoná dotaz na vloženie dát
            conn.commit()
    except Exception as e:
        logging.error(f"Failed to process file {file_path}: {e}")


# Funkcia na spracovanie súborov v hodinovom adresári
def process_hour(directory_path, conn, existing_columns, date_str):
    files = list(Path(directory_path).glob('aircraft_*.json'))  # Získanie zoznamu JSON súborov
    if not files:
        logging.info(f"No files to process in {directory_path}")
    for file in files:
        process_file(file, conn, existing_columns, date_str)  # Spracovanie každého súboru


# Funkcia na spracovanie súborov za celý deň
def process_day(directory_path):
    date_str = Path(directory_path).name  # Predpokladá, že názov adresára je vo formáte 'YYYY-MM-DD'
    logging.info(f"Processing day: {date_str}")
    conn = psycopg2.connect(**connection_parameters)  # Spojenie s databázou
    create_daily_partition(conn, date_str)  # Vytvorenie dennej partície
    existing_columns = fetch_existing_columns(conn)  # Získanie existujúcich stĺpcov

    try:
        with ThreadPoolExecutor() as executor:
            for hour_directory in Path(directory_path).iterdir():
                if hour_directory.is_dir():
                    logging.info(f"Processing hour directory: {hour_directory}")
                    executor.submit(process_hour, hour_directory, conn, existing_columns, date_str)  # Paralelné spracovanie hodinových adresárov
    except Exception as e:
        logging.error(f"Error processing day {date_str}: {e}")
    finally:
        conn.close()  # Zatvorenie spojenia s databázou


# Funkcia na spracovanie všetkých denných adresárov
def process_directory(base_path):
    path = Path(base_path)
    logging.info(f"Starting processing in base directory: {path}")
    with ThreadPoolExecutor() as executor:
        for day_directory in path.iterdir():
            if day_directory.is_dir() and day_directory.name.isdigit():  # Kontrola, či je adresár a má názov vo formáte 'YYYYMMDD'
                logging.info(f"Scheduling day directory for processing: {day_directory}")
                executor.submit(process_day, day_directory)  # Paralelné spracovanie denných adresárov
    logging.info("Finished processing all directories.")

if __name__ == '__main__':
    # Príklad použitia
    connection_parameters = {
        "host": "your_postgre_ip",  # IP adresa PostgreSQL servera
        "port": "your_postgre_port",  # Port PostgreSQL servera
        "database": "your_postgre_database_name",  # Názov databázy
        "user": "your_postgre_username",  # Používateľské meno
        "password": "your_postgre_password"  # Heslo
    }
    process_directory('/path/to/your/aircraft_json/directory')  # Spustenie spracovania adresára
