import os  # Importuje knižnicu os pre prácu so súborovým systémom
import subprocess  # Importuje knižnicu subprocess pre spúšťanie externých príkazov
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
Súbor: generate_tiles.py
Skript na generáciu dlaždíc pre Leaflet z vygenerovaných máp výskytu prevádzky
Závislý na Anaconda3 (gdal2tiles.py)
"""


# Funkcia na georeferencovanie PNG obrázku
def georeference_image(input_png, output_tif, bounds):
    lat = [str(bounds[0][0]), str(bounds[0][1])]  # Konvertovanie zemepisných šírok na reťazce
    lon = [str(bounds[1][0]), str(bounds[1][1])]  # Konvertovanie zemepisných dĺžok na reťazce
    command = [
        'gdal_translate', '-of', 'GTiff', '-a_ullr', lat[0], f'-{lon[1]}', lat[1], f'-{lon[0]}',
        '-a_srs', 'EPSG:4326', input_png, output_tif
    ]  # Príkaz na vykonanie georeferencovania (potrebuje nainštalovanú knižnicu GDAL)
    subprocess.run(command, check=True)  # Spustenie príkazu


# Funkcia na generovanie dlaždíc pomocou gdal2tiles.py
def generate_tiles(georef_tif, tiles_dir, zoom_levels):
    python_executable = "python"  # Cesta k Pythonu
    gdal_script_path = "path/to/your/anaconda3/Scripts/gdal2tiles.py"  # Cesta ku skriptu gdal2tiles.py
    gdal_command = [
        python_executable, gdal_script_path, "-p", 'mercator', '-z', zoom_levels, '-w', 'none',
        georef_tif, tiles_dir
    ]  # Príkaz na vykonanie generovania dlaždíc (potrebuje gdal2tiles.py, napríklad z anaconda3
    subprocess.run(gdal_command, check=True)  # Spustenie príkazu


# Funkcia na spracovanie jednotlivých obrázkov
def process_image(filename, image_directory, tiles_directory, bounds, zoom_levels):
    """ Spracovanie obrázku: georeferencovanie a generovanie dlaždíc. """
    input_png = os.path.join(image_directory, filename)  # Vstupný PNG obrázok
    output_tif = os.path.join(image_directory, f"georef_{filename.split('.')[0]}.tif")  # Výstupný TIF súbor
    tiles_subdir = os.path.join(tiles_directory, filename.split('.')[0])  # Výstupný adresár pre dlaždice

    georeference_image(input_png, output_tif, bounds)  # Georeferencovanie PNG obrázku
    generate_tiles(output_tif, tiles_subdir, zoom_levels)  # Generovanie dlaždíc
    os.remove(output_tif)  # Odstránenie TIF súboru po spracovaní


# Hlavná funkcia na generovanie dlaždíc
def generate_tiles_main(resolution, bounds, zoom_levels):
    base_image_directory = f'heatmap/cumulative_agl/'  # Základný adresár s obrázkami

    directories = [
        ('airport_included', f'{base_image_directory}airport_included/res_{resolution}'),
        ('airport_excluded', f'{base_image_directory}airport_excluded/res_{resolution}')
    ]  # Zoznam adresárov na spracovanie

    for directory_type, image_directory in directories:
        tiles_directory = f'tiles/{directory_type}/res_{resolution}'  # Adresár pre výstupné dlaždice
        os.makedirs(tiles_directory, exist_ok=True)  # Vytvorenie adresára, ak neexistuje

        filenames = [f for f in os.listdir(image_directory) if f.endswith('.png') and int(f.split('.')[0]) <= 1500]  # Zoznam súborov na spracovanie

        with ThreadPoolExecutor(max_workers=os.cpu_count()) as executor:
            futures = [executor.submit(process_image, filename, image_directory, tiles_directory, bounds, zoom_levels) for filename in filenames]  # Paralelné spracovanie súborov
            for future in futures:
                future.result()  # Vyzdvihnutie výsledkov a riešenie výnimiek
