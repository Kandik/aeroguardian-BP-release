from preparation_sql import run_parallel_preparation # Import skriptu na predspracovanie dát v PostgreSQL
from generate_heatmaps import generate_heatmaps # Import skriptu na generovanie máp výskytu
from generate_tiles import generate_tiles_main # Import skriptu na generovanie dlaždíc
from flip_images import flip_images # Import skriptu na obracanie dlaždíc

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
Súbor: generate_heatmaps_main.py
Hlavný skript na generovanie máp výskytu prevádzky
"""

# Parametre pripojenia k PostgreSQL databáze
connection_parameters = {
    "host": "your_postgre_ip",  # IP adresa PostgreSQL servera
    "port": "your_postgre_port",  # Port PostgreSQL servera
    "database": "your_postgre_database_name",  # Názov databázy
    "user": "your_postgre_username",  # Používateľské meno pre pripojenie
    "password": "your_postgre_password"  # Heslo pre pripojenie
}

# Hlavný blok, ktorý sa vykoná pri spustení skriptu
if __name__ == '__main__':
    # Rozlíšenia, pre ktoré sa budú generovať mapy výskytu prevádzky
    resolutions = [100, 250, 500, 1000, 2000]
    # Maximálny čas zachytávania dát v tvare 'YYYY-MM-DD HH:MM:SS'
    max_capture_time = "\'2024-05-02 19:00:00\'"
    # Kód letiska, pre ktoré sa budú generovať mapy
    airport = "LZKZ"
    # Rozlíšenie výšky mriežky pre zemný výškový model
    grid_height_resolution = 2000
    # Maximálna výška v metroch, do ktorej sa budú dáta zohľadňovať
    max_height = 8000
    # Maximálna výška, do ktorej sa budú vykresľovať mapy
    max_drawing_height = 5000
    # Vertikálny krok v metroch pre výpočty
    vertical_step = 50
    # Geografické hranice záujmovej oblasti (min a max zemepisná šírka a dĺžka)
    bounds = [(48.5, 49.5), (21.0, 22.0)]
    # Úrovne priblíženia pre generovanie dlaždíc
    zoom_levels = '7-16'

    # Spustí paralelné spracovanie SQL príprav pre rôzne rozlíšenia
    run_parallel_preparation(connection_parameters, airport, resolutions, grid_height_resolution, max_height,
                             max_drawing_height, vertical_step, max_capture_time, bounds, processes=4)

    # Generuje mapy výskytu prevádzky
    generate_heatmaps(connection_parameters, airport, resolutions, max_drawing_height, vertical_step, bounds, processes=2)

    # Pre každé rozlíšenie generuje dlaždice a otáča obrázky
    for resolution in resolutions:
        generate_tiles_main(resolution, bounds, zoom_levels)
        flip_images(f'tiles/airport_excluded/res_{resolution}/')
        flip_images(f'tiles/airport_included/res_{resolution}/')
