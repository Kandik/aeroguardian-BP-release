import psycopg2  # Importuje knižnicu psycopg2 na prácu s PostgreSQL
from multiprocessing import Pool  # Importuje Pool na paralelné spracovanie

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
Súbor: preparation_sql.py
Skript s predspracovaním PostgreSQL databázy pred generáciou máp výskytu prevádzky
"""


# Pomocná funkcia na rozbalenie argumentov pri použití multiprocessing
def run_sql(args):
    connection_parameters, airport, resolution, grid_height_resolution, max_height, max_drawing_height, \
        vertical_step, bounds, max_capture_time = args
    run_preparation_sql(connection_parameters, airport, resolution, grid_height_resolution,
                        max_height, max_drawing_height, vertical_step, bounds, max_capture_time)


# Použitie multiprocessing na paralelné spustenie SQL príprav
def run_parallel_preparation(connection_parameters, airport, resolutions, grid_height_resolution, max_height,
                             max_drawing_height, vertical_step, max_capture_time, bounds, processes):
    with Pool(processes=processes) as pool:
        pool.map(run_sql, [(connection_parameters, airport, res, grid_height_resolution, max_height,
                            max_drawing_height, vertical_step, bounds, max_capture_time) for res in resolutions])


def run_preparation_sql(connection_parameters, airport, resolution, grid_height_resolution, max_height,
                        max_drawing_height, vertical_step, bounds, max_capture_time):
    # Pripojenie k databáze
    conn = psycopg2.connect(**connection_parameters)
    cursor = conn.cursor()

    minlat, maxlat = bounds[0]
    minlon, maxlon = bounds[1]

    # SQL skript na odstránenie starých tabuliek
    sql_script = f"""
    DROP TABLE IF EXISTS aircraft_pointcloud_grid_{airport}_{resolution};
    DROP TABLE IF EXISTS heatmap_grid_{airport}_{resolution};
    """

    # SQL skript na vytvorenie tabuľky aircraft_pointcloud_grid
    sql_script += f"""
    CREATE TABLE IF NOT EXISTS aircraft_pointcloud_grid_{airport}_{resolution} (
        capture_time TIMESTAMP WITHOUT TIME ZONE,
        hex_code VARCHAR,
        lowlat NUMERIC(9,6),
        lowlon NUMERIC(9,6),
        alt_msl NUMERIC,  -- nadmorská výška v metroch
        alt_agl NUMERIC,  -- výška nad zemou v metroch
        PRIMARY KEY (capture_time, hex_code)
    );
    """

    # SQL skript na vytvorenie tabuľky heatmap_grid
    sql_script += f"""
    CREATE TABLE IF NOT EXISTS heatmap_grid_{airport}_{resolution} (
        lowlat NUMERIC(9,6),
        lowlon NUMERIC(9,6),
        lowalt INT,
        month INT,
        countmsl INT DEFAULT 0,
        countagl INT DEFAULT 0,
        PRIMARY KEY (lowlat, lowlon, lowalt, month)
    );
    """

    # SQL skript na vkladanie dát do tabuľky aircraft_pointcloud_grid
    sql_script += f"""
    INSERT INTO aircraft_pointcloud_grid_{airport}_{resolution} (
        capture_time,
        hex_code,
        lowlat,
        lowlon,
        alt_msl,
        alt_agl
    )
    SELECT
        p.capture_time,
        p.hex_code,
        floor(p.lat_num * {resolution}) / {resolution} AS lowlat,
        floor(p.lon_num * {resolution}) / {resolution} AS lowlon,
        LEAST(8000, GREATEST(g.groundheight, COALESCE(p.alt_geom_num * 0.3048, p.alt_baro_num * 0.3048))) AS alt_msl,
        GREATEST(0, LEAST({max_height}, COALESCE(p.alt_geom_num * 0.3048, p.alt_baro_num * 0.3048)) - g.groundheight) AS alt_agl
    FROM
        aircraft_pointcloud p
    LEFT JOIN
        grid_ground_height_{airport}_{grid_height_resolution} g ON (
            floor(p.lat_num * {grid_height_resolution}) / {grid_height_resolution} = g.lowlat AND
            floor(p.lon_num * {grid_height_resolution}) / {grid_height_resolution} = g.lowlon
        )
    WHERE
        p.lat_num BETWEEN {minlat} AND {maxlat} AND
        p.lon_num BETWEEN {minlon} AND {maxlon} AND
        p.capture_time <= {max_capture_time}
        AND (COALESCE(p.alt_geom_num * 0.3048, p.alt_baro_num * 0.3048) <= 8000);
    """

    # SQL skript na vkladanie dát do tabuľky heatmap_grid (nadmorská výška)
    sql_script += f"""
    INSERT INTO heatmap_grid_{airport}_{resolution} (lowlat, lowlon, lowalt, month, countmsl)
    SELECT
        lowlat,
        lowlon,
        CASE
            WHEN FLOOR(alt_msl / {vertical_step}) * {vertical_step} >= {max_drawing_height} THEN {max_drawing_height}
            ELSE FLOOR(alt_msl / {vertical_step}) * {vertical_step}
        END AS lowalt,
        EXTRACT(MONTH FROM capture_time) AS month,
        COUNT(DISTINCT hex_code) AS countmsl
    FROM
        aircraft_pointcloud_grid_{airport}_{resolution}
    WHERE
        alt_msl <= {max_height}
    GROUP BY
        lowlat, lowlon, lowalt, month
    ON CONFLICT (lowlat, lowlon, lowalt, month)
    DO UPDATE SET
        countmsl = EXCLUDED.countmsl;
    """

    # SQL skript na vkladanie dát do tabuľky heatmap_grid (výška nad zemou)
    sql_script += f"""
    INSERT INTO heatmap_grid_{airport}_{resolution} (lowlat, lowlon, lowalt, month, countagl)
    SELECT
        lowlat,
        lowlon,
        CASE
            WHEN FLOOR(alt_agl / {vertical_step}) * {vertical_step} >= {max_drawing_height} THEN {max_drawing_height}
            ELSE FLOOR(alt_agl / {vertical_step}) * {vertical_step}
        END AS lowalt,
        EXTRACT(MONTH FROM capture_time) AS month,
        COUNT(DISTINCT hex_code) AS countagl
    FROM
        aircraft_pointcloud_grid_{airport}_{resolution}
    GROUP BY
        lowlat, lowlon, lowalt, month
    ON CONFLICT (lowlat, lowlon, lowalt, month)
    DO UPDATE SET
        countagl = EXCLUDED.countagl;
    """

    # Spustenie SQL skriptu
    cursor.execute(sql_script)
    conn.commit()  # Potvrdí vykonané operácie v databáze
