import os  # Importuje knižnicu os pre prácu so súborovým systémom
from PIL import Image  # Importuje knižnicu Pillow pre prácu s obrázkami
from multiprocessing import Pool, cpu_count  # Importuje Pool a cpu_count pre paralelné spracovanie

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
Súbor: flip_images.py
Skript na obracanie vygenerovaných dlaždíc
"""


# Funkcia na obracanie obrázku
def flip_image(image_info):
    image_path, output_path = image_info
    try:
        with Image.open(image_path) as img:  # Otvorenie obrázku
            flipped_img = img.transpose(Image.FLIP_TOP_BOTTOM)  # Obrátenie obrázku zhora nadol
            flipped_img.save(output_path)  # Uloženie obrázku
    except Exception as e:
        pass  # Ignorovanie výnimiek (môže byť pridané logovanie)


# Funkcia na zhromažďovanie obrázkov na spracovanie
def collect_images_to_process(directory, required_depth):
    images_to_process = []
    for root, dirs, files in os.walk(directory):  # Prechádzanie adresárovou štruktúrou
        current_depth = len(os.path.relpath(root, directory).split(os.sep))  # Výpočet aktuálnej hĺbky

        if current_depth == required_depth:  # Ak je aktuálna hĺbka rovnaká ako požadovaná hĺbka
            for file in files:
                if file.lower().endswith('.png'):  # Kontrola prípony súboru
                    file_path = os.path.join(root, file)  # Získanie cesty k súboru
                    images_to_process.append((file_path, file_path))  # Pridanie do zoznamu na spracovanie
    return images_to_process


# Funkcia na obracanie obrázkov v zadanom adresári
def flip_images(directory_to_process):
    required_depth = 3  # Požadovaná hĺbka prehľadávania

    images = collect_images_to_process(directory_to_process, required_depth)  # Zhromaždenie obrázkov na spracovanie

    print(f"Found {len(images)} images that needs processing.")  # Výpis počtu nájdených obrázkov

    # Paralelné spracovanie obrázkov pomocou Pool
    with Pool(processes=cpu_count()) as pool:
        pool.map(flip_image, images)  # Spustenie paralelného spracovania obrázkov
