## Tracker Detecor

Outillage permettant de surveiller les trackers web utilisés par des applications Web

### Features

* Détection des trackers utilisé par des applications web
* Comparaison des trackers détectés avec un référentiel de trackers attendus
* Génération d'un PDF de synthèse des trackers utilisés

### Trackers supportés

* Cookies
* Pixel (wip)
* Local storage (todo)
* Redirection (todo)
* Fingerprint (todo)

### Installation pour test
 
A la racine du projet :

    docker-compose up
### Installation dans un context de dev

#### Database

A la racine, avec Doker Compose :

    docker-compose run -p 5432:5432 -d postgres

#### Frontend

A la racine du répertoire **frontend**

    npm install
    ng serve

L'IHM est ensuite disponible à cette adresse : http://localhost:4200

#### Backend

A la racine du répertoire **bakend**

    npm install
    npx prisma generate
    npx prisma db push
    npm run start:dev


L'API est ensuite disponible à cette adresse : http://localhost:3000/graphql


### Collecteurs

Les collecteurs sont des applications en charge de l'observation des trackers exposés par les applications

#### Collecteur Extension Chrome

L'extension Chrome permet d'observer le contenu d'onglets d'un navigateur dans le but de détécter la présence de traçeurs, produire un rapport et envoyer vers le serveur des rapports de détection.
Depuis le gestionnaire d'extension de Chrome, activer le mode dev afin de pouvoir charger une extension "non empaquetée" et selectionner ensuite le répertoire :

    /collectors/chrome-extension

#### Collecteur Agent JS (wip)

L'agent JS permet de collecter des traçeurs dans un contexte où l'utilisation d'un extension de navigateur ne serait pas déployable.

La mise en place de l'agent JS implique d'exposer le code source de cet agent sur un serveur http avec le même domaine que celui des applications à observer.


