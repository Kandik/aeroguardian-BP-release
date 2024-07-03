/*
Technická univerzita v Košiciach
Fakulta elektrotechniky a informatiky
Katedra kybernetiky a umelej inteligencie

Zvyšovanie bezpečnosti integrácie dronov do leteckého priestoru - Bakalárska práca

Autor:
Štefan Kando

Vedúci práce:
doc. Ing. Peter Papcun, PhD.

2024
 */

/*
Súbor: aeroguardian-init.sql
SQL skript na vygenerovanie dátového modela pre logging a spracovanie dát AeroGuardianu
(nepoužívané priamo v hlavnej aplikácii)
 */

-- Vytvorenie databázy
CREATE DATABASE aeroguardian;

-- Pripojenie k novovytvorenej databáze
\c aeroguardian;

-- Vytvorenie tabuľky sources
CREATE TABLE sources (
    source_id SERIAL PRIMARY KEY,
    receiver_name VARCHAR,
    receiver_website VARCHAR
);

-- Vytvorenie tabuľky aircraft_pointcloud
CREATE TABLE aircraft_pointcloud (
    source_id INTEGER,
    capture_time TIMESTAMP WITHOUT TIME ZONE,
    hex_code VARCHAR,
    PRIMARY KEY (source_id, capture_time, hex_code),
    FOREIGN KEY (source_id) REFERENCES sources(source_id)
);
