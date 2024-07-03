from flask import Flask, request, jsonify, send_from_directory  # Importuje potrebné moduly a funkcie z Flask framework
from flask_cors import CORS, cross_origin  # Importuje modul Flask-CORS na povolenie CORS (Cross-Origin Resource Sharing)
import requests  # Importuje requests modul na vykonávanie HTTP požiadaviek
from check_breach import check_aircraft_zone_violations  # Importuje vlastnú funkciu na kontrolu narušení zóny lietadlami
import os  # Importuje os modul na prácu so súborovým systémom

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
Súbor: main.py
Hlavný skript Flask back-endu
"""

# Inicializácia Flask aplikácie
app = Flask(__name__)
# Povolenie CORS pre všetky zdroje na ceste /data/*
CORS(app, resources={r"/data/*": {"origins": "*"}})

# Nastavenie režimu ladenia (debug)
# Nastav na False pri deploymente
debug = True

# Premenné na ukladanie najnovšej polohy dronu a dát o lietadlách
latest_drone_location = {}
aircraft_data = {}


# Funkcia na validáciu dát prichádzajúcich z dronu
def validate_data(data):
    required_fields = ['latitude', 'longitude', 'altitude']
    for field in required_fields:
        if field not in data or not isinstance(data[field], (float, int)):
            return False
    return True


# Endpoint na poskytovanie heatmapových dlaždíc
@app.route('/heatmap/<string:included>/res_<int:resolution>/<int:height>/<int:z>/<int:x>/<int:y>.png')
@cross_origin()
def serve_tile(included, resolution, height, z, x, y):
    # Definovanie základného adresára
    base_folder = 'path/to/your/root/tiles/folder'

    # Vytvorenie relatívnej cesty správne s použitím lomiek
    tile_path = f'{included}/res_{resolution}/{height}/{z}/{x}/{y}.png'

    # Kontrola, či súbor existuje (pre ladenie)
    full_path = os.path.join(base_folder, tile_path)
    if os.path.exists(full_path):
        print("Súbor nájdený, pokus o poskytnutie:", full_path)
        return send_from_directory(base_folder, tile_path)
    else:
        print("Súbor nebol nájdený na ceste:", full_path)
        return "File not found", 404


# Endpoint na prijímanie dát o polohe dronu
@app.route('/drone_location', methods=['POST'])
@cross_origin()
def receive_drone_data():
    global latest_drone_location

    if request.is_json:
        data = request.get_json()
        print(data)
        if validate_data(data):
            latest_drone_location = data
            return jsonify({"status": "success", "message": "Data received and validated"}), 200
        else:
            return jsonify({"status": "error", "message": "Invalid data"}), 400
    else:
        return jsonify({"status": "error", "message": "Request must be JSON"}), 400


# Endpoint na získavanie dát o lietadlách
@app.route('/data')
@cross_origin()
def data():
    global aircraft_data
    url = 'http://your_skyaware_server/data/aircraft.json'
    # url = 'local_path_to_aircraft.json'

    try:
        response = requests.get(url)
        if response.status_code == 200:
            aircraft_data = response.json()
            return jsonify(aircraft_data)
        else:
            return jsonify({"error": "Nepodarilo sa načítať dáta"}), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


# Endpoint na poskytovanie najnovších dát o polohe dronu
@app.route('/drone_data')
@cross_origin()
def drone_data():
    global latest_drone_location

    print(latest_drone_location)

    # Nová trasa na poskytovanie najnovšej polohy dronu pre vašu webovú aplikáciu.
    if latest_drone_location:
        return jsonify(latest_drone_location)
    else:
        return jsonify({"error": "Nie sú dostupné dáta o polohe dronu"}), 404


# Endpoint na kontrolu narušení zóny
@app.route('/check_breach', methods=['POST'])
@cross_origin()
def check_breach():
    global aircraft_data

    data = request.get_json()
    zone_info = data.get('zoneData')
    settings = data.get('settings')

    if not zone_info:
        return jsonify({"error": "Žiadna zóna nebola špecifikovaná"}), 404

    print(zone_info)
    output = check_aircraft_zone_violations(zone_info, settings, aircraft_data)
    print(output)
    return jsonify(output)


# Spustenie aplikácie
if __name__ == '__main__':
    if debug:
        # Použitie vstavaného Flask servera pre vývojové účely
        app.run(debug=True, host="0.0.0.0", port=4000)
    else:
        # Použitie Waitress servera pre produkčné prostredie
        from waitress import serve
        serve(app, host="0.0.0.0", port=4000)
