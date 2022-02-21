[![Node.js CI](https://github.com/pierremellet/TrackerDetector/actions/workflows/node.js.yml/badge.svg)](https://github.com/pierremellet/TrackerDetector/actions/workflows/node.js.yml)

# Tracker Detector


Application permettant de collecter les différents trackers exposés par une application Web et permettant de produire des rapports d'observations.

* [Spécification de l'api GraphQL](./backend/graphql)
* [Architecture](./docs/architecture.md).

# Installation
##  Docker (Frontend en Backend)

A la racine du projet, lancer la commande :

    docker-compose up


L'interface graphique de l'application est ensuite disponible à l'adresse : 

    http://localhost:4000


L'api GraphQL est joignable sur à l'adresse :

    http://localhost:3000/graphql
    ws://localhost:3000/graphql


