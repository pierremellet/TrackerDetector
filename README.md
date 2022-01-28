![backend workflow](https://github.com/pierremellet/TrackerDetector/actions/workflows/node.js.yml/badge.svg)


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

## Collecteurs

Les collecteurs sont des applications en charge de l'observation des trackers exposés par les applications

### Collecteur Extension Chrome

L'extension Chrome permet d'observer le contenu d'onglets d'un navigateur dans le but de détécter la présence de traçeurs, produire un rapport et envoyer vers le serveur des rapports de détection.
Depuis le gestionnaire d'extension de Chrome, activer le mode dev afin de pouvoir charger une extension "non empaquetée" et selectionner ensuite le répertoire :

    /collectors/chrome-extension

### Collecteur Agent JS

L'agent JS permet de collecter des traçeurs dans un contexte où l'utilisation d'un extension de navigateur ne serait pas déployable.

La mise en place de l'agent JS implique d'exposer le code source de cet agent sur un serveur http avec le même domaine que celui des applications à observer.



