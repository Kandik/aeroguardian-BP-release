import os  # Importuje knižnicu os pre prácu so súborovým systémom
import numpy as np  # Importuje knižnicu numpy pre numerické výpočty
import pandas as pd  # Importuje knižnicu pandas pre prácu s dátovými rámcami
import matplotlib.pyplot as plt  # Importuje knižnicu matplotlib pre kreslenie grafov
import psycopg2  # Importuje knižnicu psycopg2 pre prácu s PostgreSQL databázou
from shapely.geometry import Point, Polygon as ShapelyPolygon  # Importuje Point a Polygon z knižnice shapely pre prácu s geometriou
from multiprocessing import Pool  # Importuje Pool pre paralelné spracovanie

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
Súbor: generate_heatmaps.py
Skript pre generovanie máp výskytu prevádzky cez matplotlib z nazbieraných dát v databáze
"""

# Definícia polygónu letiska (airport_polygon)
airport_polygon = ShapelyPolygon([
    (48.630468567309784, 21.23721985404699),  # Spodný ľavý roh
    (48.63407358488808, 21.21720949873011),  # Horný ľavý roh
    (48.689883033580244, 21.237048192984535),  # Horný pravý roh
    (48.68569003519526, 21.258334203097764)  # Spodný pravý roh
])

# Definícia vylúčenej oblasti dráhy (runway_exclusion_area)
runway_exclusion_area = ShapelyPolygon([
    (48.562041637997694, 21.203023024664546),
    (48.562041637997694, 21.209713666089904),
    (48.7648586309854, 21.279566756279085),
    (48.7648586309854, 21.27284921585959)
])

# Funkcia na načítanie dát z PostgreSQL databázy
def fetch_data(conn_params, table_name, max_alt):
    conn = psycopg2.connect(**conn_params)  # Pripojenie k databáze
    query = f"""
    SELECT lowlat, lowlon, lowalt, 
           SUM(SUM(countagl)) OVER (PARTITION BY lowlat, lowlon ORDER BY lowalt RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as cumulative_agl
    FROM {table_name}
    WHERE lowalt <= {max_alt}
    GROUP BY lowlat, lowlon, lowalt
    ORDER BY lowlat, lowlon, lowalt;
    """
    df = pd.read_sql(query, conn)  # Načítanie výsledku dotazu do pandas DataFrame
    conn.close()  # Uzavretie pripojenia k databáze
    return df  # Vrátenie DataFrame


# Funkcia na vykreslenie heatmapy
def plot_heatmap(params):
    df, alt, resolution, type_, conn_params, exclude_airport, bounds = params
    if df.empty:
        print(f"No data available for altitude {alt} meters.")
        return

    min_lat, max_lat = bounds[0]
    min_lon, max_lon = bounds[1]

    delta = 1 / resolution
    lats = np.arange(min_lat, max_lat, delta)  # Vytvorenie rozsahu zemepisných šírok
    lons = np.arange(min_lon, max_lon, delta)  # Vytvorenie rozsahu zemepisných dĺžok

    scale_factor = 6  # 5x5 pixelov pre dáta, 1 pixel pre mriežku
    grid_dim_y = len(lats) * scale_factor
    grid_dim_x = len(lons) * scale_factor
    grid = np.zeros((grid_dim_y, grid_dim_x, 4))  # Inicializácia RGBA mriežky

    # Kombinácia letiska a vylúčenej oblasti dráhy
    if exclude_airport:
        exclusion_areas = airport_polygon.union(runway_exclusion_area)
        df['point'] = df.apply(lambda row: Point(row['lowlat'], row['lowlon']), axis=1)
        df_without_exclusions = df[~df['point'].apply(exclusion_areas.contains)]
    else:
        df_without_exclusions = df

    if df_without_exclusions.empty:
        print("No data available outside the airport and runway exclusion areas." if exclude_airport else "No data available.")
        return

    # Minimálna a maximálna hodnota na výpočet gradientu
    min_val, max_val = df_without_exclusions[type_].min(), df_without_exclusions[type_].max()

    for _, row in df.iterrows():
        point = Point(row['lowlat'], row['lowlon'])
        lat_idx = int(np.searchsorted(lats, row['lowlat']) * scale_factor)
        lon_idx = int(np.searchsorted(lons, row['lowlon']) * scale_factor)
        is_airport = airport_polygon.contains(point)
        is_runway = runway_exclusion_area.contains(point)

        # Normalizovaná hodnota pre heatmapu
        normalized_value = 0.25 + 0.75 * ((row[type_] - min_val) / (max_val - min_val))

        # Štvorce majú maximálny gradient ak patria k letisku alebo dráhe a letisko s dráhou
        # sa nepočítajú do gradientu
        color = [normalized_value, 0, 0, 1] if not ((is_airport or is_runway) and exclude_airport) else [1, 0, 0, 1]

        for i in range(5):
            for j in range(5):
                if lat_idx + i < grid_dim_y and lon_idx + j < grid_dim_x:
                    grid[lat_idx + i, lon_idx + j, :] = color

    fig, ax = plt.subplots(figsize=(150, 150))
    ax.imshow(grid, origin='lower', extent=[min_lon, max_lon, min_lat, max_lat])

    # Nápisy letísk
    plt.text(21.24, 48.66, "LZKZ\nAIRPORT", color='white', ha='center', va='center', fontsize=48, fontweight='bold')
    plt.text(21.45, 48.74, "LZBD\nAIRPORT", color='white', ha='center', va='center', fontsize=24, fontweight='bold')

    plt.axis('off')
    dir_path = f'heatmap/{type_}/{"airport_excluded" if exclude_airport else "airport_included"}/res_{resolution}'
    os.makedirs(dir_path, exist_ok=True)
    plt.savefig(f'{dir_path}/{alt}.png', bbox_inches='tight', transparent=True)
    plt.close()

# Hlavná funkcia na generovanie heatmap
def generate_heatmaps(connection_parameters, airport, resolutions, max_alt, step, bounds, processes):
    args = []

    for exclude_airport in [False, True]:
        for res in resolutions:
            table_name = f"heatmap_grid_{airport}_{res}"
            data = fetch_data(connection_parameters, table_name, max_alt)
            for alt in range(0, max_alt + step, step):
                cum_data = data[data['lowalt'] <= alt].groupby(['lowlat', 'lowlon', 'lowalt']).sum().reset_index()
                args.append((cum_data, alt, res, 'cumulative_agl', connection_parameters, exclude_airport, bounds))

    with Pool(processes=processes) as pool:
        pool.map(plot_heatmap, args)
