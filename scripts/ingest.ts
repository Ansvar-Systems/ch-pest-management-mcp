/**
 * Switzerland Pest Management MCP — Data Ingestion Script
 *
 * Populates the database with Swiss pest management data from:
 * - BLW Pflanzenschutzmittelverzeichnis (psm.admin.ch) — zugelassene PSM
 * - Agroscope — Schadschwellen, Pflanzenschutzempfehlungen, Prognosesysteme
 * - AGRIDEA — OELN-Checklisten Feldbau/Rebbau/Obstbau
 * - Aktionsplan Pflanzenschutzmittel — Risikoreduktion, Pufferstreifen
 *
 * Usage: npm run ingest
 */

import { createDatabase } from '../src/db.js';
import { mkdirSync, writeFileSync } from 'fs';

mkdirSync('data', { recursive: true });
const db = createDatabase('data/database.db');

const now = new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// 1. Pests — Insects (Schaedlinge)
//    Sources: Agroscope Pflanzenschutzempfehlungen, AGRIDEA OELN-Listen
// ---------------------------------------------------------------------------

interface Pest {
  id: string;
  name: string;
  pest_type: 'insect' | 'disease' | 'weed';
  scientific_name: string;
  crops_affected: string[];
  crop_category: string;
  lifecycle: string;
  identification: string;
  damage_description: string;
  language: string;
}

const pests: Pest[] = [
  // --- Insects (Schaedlinge) ---
  {
    id: 'blattlaeuse',
    name: 'Blattlaeuse',
    pest_type: 'insect',
    scientific_name: 'Sitobion avenae, Rhopalosiphum padi, Metopolophium dirhodum',
    crops_affected: ['Winterweizen', 'Sommerweizen', 'Wintergerste', 'Sommergerste', 'Triticale', 'Hafer'],
    crop_category: 'feldbau',
    lifecycle: 'Ueberwinterung als Ei auf Gehoelzen (Wirtswechsel) oder als Adulte auf Wintergetreide. Massenentwicklung ab Mai bei warmer Witterung. Mehrere Generationen pro Saison (parthenogenetisch). Gefluegelteformen wandern im Herbst zurueck auf Winterwirt.',
    identification: 'Gruene, braune oder rote Blattlaeuse an Blaettern und Aehren. Kolonienbildung an Blattunterseiten und Aehren. Honigtaubildung (klebrige Belaege). Schwarz gefaerbter Russstaupilz auf Honigtau.',
    damage_description: 'Direkter Schaden durch Saugen: Blattrollen, Vergilbung, reduzierte Kornfuellung. Indirekter Schaden als Virusvektoren (Gerstengelbverzwergungsvirus BYDV). Ertragsverluste bis 15-20% bei starkem Aehrenbefall.',
    language: 'DE',
  },
  {
    id: 'getreidehaehnchen',
    name: 'Getreidehaehnchen',
    pest_type: 'insect',
    scientific_name: 'Oulema melanopus',
    crops_affected: ['Winterweizen', 'Sommerweizen', 'Wintergerste', 'Sommergerste', 'Hafer', 'Triticale'],
    crop_category: 'feldbau',
    lifecycle: 'Ueberwinterung als Kaefer im Boden. Zuflug ins Getreide ab April. Eiablage an Blattoberseite (Maerz-Mai). Larven (3 Stadien) fressen Fensterfrass. Verpuppung im Boden. Eine Generation pro Jahr.',
    identification: 'Kaefer: 4-5mm, metallisch blaue Fluegel, roter Halsschild. Larve: gelblich, mit schwarzem Schleimmantel (Kothuelse) bedeckt. Eier: gelblich, laenglich, einzeln an Blaettern. Fensterfrass: laengliche Streifen auf Blaettern (Epidermis einseitig stehen gelassen).',
    damage_description: 'Larven-Fensterfrass an Fahnenblatt und oberem Blattpaar reduziert Photosynthese. Bei starkem Befall (>1 Ei/Larve pro Halm) Ertragsverluste bis 10%. Fahnenblattschaden besonders ertragsrelevant.',
    language: 'DE',
  },
  {
    id: 'rapsglanzkaefer',
    name: 'Rapsglanzkaefer',
    pest_type: 'insect',
    scientific_name: 'Brassicogethes aeneus (syn. Meligethes aeneus)',
    crops_affected: ['Winterraps', 'Sommerraps'],
    crop_category: 'feldbau',
    lifecycle: 'Ueberwinterung als Kaefer in Waldstreu/Hecken. Zuflug in Raps ab Maerz/April bei Temp >12°C (Prognose SOPRA). Eiablage in geschlossene Blueten. Larven fressen an Pollen. Verpuppung im Boden. Neue Kaefer ab Juni, Abwanderung in Ueberwinterungsquartier.',
    identification: 'Kaefer: 2-3mm, metallisch gruen-schwarz glaenzend. Finden sich in Blueten und geschlossenen Knospen. Larven: weisslich-gelblich in den Blueten. Knospenabfall und -verbräunung als Schadmerkmal.',
    damage_description: 'Kaefer fressen an geschlossenen Knospen (Knospenstadium BBCH 51-59), verursachen Knospenabfall. Offene Blueten sind nicht gefaehrdet (Pollen frei zugaenglich). Ertragsverluste bis 30-50% bei starkem Fruebefall. In der Bluete kein Schaden mehr.',
    language: 'DE',
  },
  {
    id: 'kartoffelkaefer',
    name: 'Kartoffelkaefer',
    pest_type: 'insect',
    scientific_name: 'Leptinotarsa decemlineata',
    crops_affected: ['Kartoffeln', 'Auberginen', 'Tomaten'],
    crop_category: 'feldbau',
    lifecycle: 'Ueberwinterung als Kaefer im Boden (20-60 cm Tiefe). Zuflug ab Mai bei Bodentemperatur >14°C. Eiablage an Blattunterseiten (gelbe Eipakete). 4 Larvenstadien (2-3 Wochen). Verpuppung im Boden. 1-2 Generationen/Jahr in der Schweiz.',
    identification: 'Kaefer: 10-12mm, gelb mit 10 schwarzen Laengsstreifen. Eier: orange-gelb, Pakete (20-60 Stueck) an Blattunterseite. Larven: rot-orange mit schwarzen Punkten, gewoelbt. Frass: Lochfrass bis Skelettierung der Blaetter.',
    damage_description: 'Blattfrass durch Larven und Kaefer. Vollstaendige Entlaubung moeglich. Bei >2 Larven/Staude und starkem Frass Ertragsverluste bis 50%. Besonders kritisch in der Knollenbildungsphase.',
    language: 'DE',
  },
  {
    id: 'erdfloh',
    name: 'Erdfloh (Rapserdfloh)',
    pest_type: 'insect',
    scientific_name: 'Psylliodes chrysocephala',
    crops_affected: ['Winterraps', 'Sommerraps', 'Kohlgewaechse'],
    crop_category: 'feldbau',
    lifecycle: 'Ueberwinterung als Larve im Stengel oder Blattrosette des Rapses. Kaefer schlupft im Fruehling, Sommerruhe im Boden. Zuflug in Rapssaaten ab September. Eiablage am Wurzelhals. Larve dringt in Blattstiel und Stengel ein.',
    identification: 'Kaefer: 3-4mm, dunkel metallisch, kraeftige Hinterbeine (Sprungbeine). Lochfrass an Keimblaettern und jungen Blaettern (kleine runde Loecher). Larve: weisslich, im Stengel verborgen. Befallene Pflanzen knicken im Winter/Fruehling leichter.',
    damage_description: 'Herbstfrass an Keimblaettern: Schwaechen bei Auflauf, Pflanzenausfaelle. Winterfrass durch Larven im Stengel: gestorte Entwicklung, Frostempfindlichkeit. Ertragsverluste bei starkem Larvenfrassbefall bis 20%.',
    language: 'DE',
  },
  {
    id: 'kohlschotenmruessler',
    name: 'Kohlschotenruessler',
    pest_type: 'insect',
    scientific_name: 'Ceutorhynchus obstrictus',
    crops_affected: ['Winterraps', 'Sommerraps'],
    crop_category: 'feldbau',
    lifecycle: 'Ueberwinterung als Kaefer im Boden. Zuflug in Raps bei Bluete (BBCH 60-69). Eiablage in junge Schoten. Larve frisst an Koernern. Verpuppung im Boden. Eine Generation pro Jahr. Prognose via SOPRA.',
    identification: 'Kaefer: 2.5-3mm, graubraun, Ruessler. Befallene Schoten mit Einstichloechern. Larve: weisslich, im Schoteninneren. Vorzeitiges Aufplatzen befallener Schoten.',
    damage_description: 'Larvenfrass an Rapssamen in der Schote. Befallene Schoten platzen vorzeitig. Eintrittsloecher ermoeglichen Sekundaerbefall durch Kohlschotenmruecke. Ertragsverluste bis 15%.',
    language: 'DE',
  },
  {
    id: 'apfelwickler',
    name: 'Apfelwickler',
    pest_type: 'insect',
    scientific_name: 'Cydia pomonella',
    crops_affected: ['Apfel', 'Birne', 'Walnuss'],
    crop_category: 'obstbau',
    lifecycle: 'Ueberwinterung als Larve in Kokon unter Rinde. Verpuppung im Fruehling. Falterflug ab Mai/Juni (1. Generation), Eiablage auf Fruechte/Blaetter. Larve bohrt sich in Frucht. 2. Generation ab Juli/August in waermeren Lagen.',
    identification: 'Falter: 15-20mm Spannweite, graubraun mit kupferfarbenem Fleck. Larve: rosa-weiss mit braunem Kopf, im Fruchtinneren. Wurmloecher mit Kotkruemeln an der Frucht. Fruehreife und Fruchtfall befallener Aepfel.',
    damage_description: 'Fruchtfleischfrass und Kerngehaeuse-Zerstoerung. Befallene Fruechte nicht mehr vermarktbar. Bei unbekämpftem Befall 30-80% wurmstichige Aepfel. Wichtigster Obstschaedling der Schweiz.',
    language: 'DE',
  },
  {
    id: 'traubenwickler',
    name: 'Traubenwickler (Einbindiger/Bekreuzter)',
    pest_type: 'insect',
    scientific_name: 'Eupoecilia ambiguella / Lobesia botrana',
    crops_affected: ['Reben'],
    crop_category: 'rebbau',
    lifecycle: 'E. ambiguella: Ueberwinterung als Puppe in der Borke. 1. Generation (Heuwurm) ab Mai befaellt Blueten, 2. Generation (Sauerwurm) ab Juli befaellt Trauben. L. botrana: aehnlicher Zyklus, waermeliebender, in Deutschschweiz seltener.',
    identification: 'E. ambiguella Falter: 12-14mm, gelblich mit dunklem Querband. L. botrana: graubraun marmoriert. Heuwurm: Gespinstbildung in Gescheinen. Sauerwurm: Raupen in Trauben, Essigfaeulenester.',
    damage_description: 'Heuwurm: reduzierte Gescheine, weniger problematisch. Sauerwurm: Bohrfrasslocher in Beeren foerdern Botrytis und Essigfaeule. Bei starkem Befall hohe Ernteverluste und Qualitaetseinbussen.',
    language: 'DE',
  },
  {
    id: 'maiszuensler',
    name: 'Maiszuensler',
    pest_type: 'insect',
    scientific_name: 'Ostrinia nubilalis',
    crops_affected: ['Silomais', 'Koernermais'],
    crop_category: 'feldbau',
    lifecycle: 'Ueberwinterung als Larve in Stoppeln und Stengeln. Verpuppung im Fruehling. Falterflug ab Juni. Eiablage an Blattunterseiten. Larve bohrt sich in Stengel. Eine Generation pro Jahr in der Schweiz.',
    identification: 'Falter: 25-30mm, gelbbraun (Weibchen heller). Eihaufen an Blattunterseiten (dachziegelartig). Larve: fleischfarben mit dunklem Kopf, bis 25mm. Bohrloecher im Stengel, Bohrmehl.',
    damage_description: 'Stengelbohrer: Stengel knickt ab (Stengelbruch), Kolbenabknickung. Eintrittslocher fuer Fusarium-Pilze (Stengel- und Kolbenfusariose). Ertragsverluste 5-20%, Mykotoxin-Risiko.',
    language: 'DE',
  },

  // --- Diseases (Krankheiten) ---
  {
    id: 'septoria',
    name: 'Septoria-Blattduerre',
    pest_type: 'disease',
    scientific_name: 'Zymoseptoria tritici (syn. Septoria tritici)',
    crops_affected: ['Winterweizen', 'Sommerweizen', 'Triticale'],
    crop_category: 'feldbau',
    lifecycle: 'Ueberdauerung auf Stoppeln und Ernterueckstaenden. Primaerinfektionen im Herbst (Ascosporen). Sekundaerinfektionen durch Pyknosporen (Regenspritzer) waehrend der Vegetation. Latenzzeit 14-28 Tage. Optimum: 15-25°C, feuchte Bedingungen.',
    identification: 'Laengliche, hellbraune bis graue Flecken mit dunklem Rand auf unteren Blaettern, aufsteigend. Schwarze Pyknidien (Fruchkoerper) in den Flecken sichtbar mit Lupe. Blaetter vertrocknen von unten nach oben.',
    damage_description: 'Wichtigste Weizenkrankheit in der Schweiz. Reduktion der Photosynthese-Flaeche, vorzeitige Blattabsterben. Ertragsrelevant wenn Fahnenblatt und F-1 befallen. Ertragsverluste bis 30-40% bei feuchten Jahren.',
    language: 'DE',
  },
  {
    id: 'fusarium',
    name: 'Fusarium-Aehrenbefall (Aehrenfusariose)',
    pest_type: 'disease',
    scientific_name: 'Fusarium graminearum, F. culmorum, F. avenaceum',
    crops_affected: ['Winterweizen', 'Sommerweizen', 'Wintergerste', 'Triticale', 'Silomais', 'Koernermais'],
    crop_category: 'feldbau',
    lifecycle: 'Ueberdauerung auf Ernterueckstaenden (v.a. Maisstoppeln). Infektion der Aehre waehrend der Bluete (BBCH 61-69) bei feuchter Witterung. Ascosporen werden durch Wind und Regen verbreitet. Prognose via FusaProg (Agroscope).',
    identification: 'Partielle Weissaehrigkeit: einzelne Aehrchengruppen bleichen vorzeitig aus. Orange-rosa Sporenlager an Spelzen bei feuchtem Wetter. Kuemmerkoerner (schmal, hell, leicht). Befallene Koerner koennen rosa verfaerbt sein.',
    damage_description: 'Ertragsverluste durch Kuemerkoernung. Mykotoxinbelastung (DON, ZEA, T-2/HT-2) — Ueberschreitung der Grenzwerte fuer Lebensmittel und Futtermittel. Grenzwert DON: 1250 µg/kg (Mehl), 1750 µg/kg (Rohgetreide). Nach Mais als Vorfrucht besonders hohes Risiko.',
    language: 'DE',
  },
  {
    id: 'krautfaeule',
    name: 'Kraut- und Knollenfaeule (Phytophthora)',
    pest_type: 'disease',
    scientific_name: 'Phytophthora infestans',
    crops_affected: ['Kartoffeln', 'Tomaten'],
    crop_category: 'feldbau',
    lifecycle: 'Ueberdauerung als Myzel in befallenen Knollen (Durchwuchs, Abfallhaufen). Primaerinfektionen im Fruehling bei feucht-warmer Witterung (>10°C, Blattnassdauer >6h). Sporangien werden durch Wind verbreitet. Sekundaerinfektionen alle 4-7 Tage moeglich. Prognose via PhytoPRE (Agroscope).',
    identification: 'Oelig-waessrige, dunkelgruene bis braune Flecken an Blaettern, meist vom Blattrand ausgehend. Weisslicher Sporangienrasen auf Blattunterseite bei feuchtem Wetter. Braeunliche Stengelnekrosen. Knollenbefall: eingesunkene, bleigraue Stellen, rotbraunes Fleisch.',
    damage_description: 'Schnelle Bestandesvernichtung moeglich (innerhalb 1-2 Wochen). Knollenfaeule bei Ernte und Lagerung. Wichtigste Kartoffelkrankheit weltweit und in der Schweiz. Ertragsverluste bis 100% ohne Bekaempfung. Bio-Betriebe besonders betroffen (Kupfer als einziges Mittel).',
    language: 'DE',
  },
  {
    id: 'falscher-mehltau-reben',
    name: 'Falscher Mehltau der Rebe (Peronospora)',
    pest_type: 'disease',
    scientific_name: 'Plasmopara viticola',
    crops_affected: ['Reben'],
    crop_category: 'rebbau',
    lifecycle: 'Ueberwinterung als Oosporen im Falllaub. Primaerinfektionen im Fruehling bei >10°C, Regen, Blattnassdauer. Sekundaerzyklus alle 5-14 Tage bei feuchter Witterung. Prognose via VitiMeteo.',
    identification: 'Oelflecken: gelbliche, oelig glaenzende Flecken auf Blattoberseite. Weisser Sporangienrasen auf Blattunterseite (bei Feuchtigkeit). Lederbeeren: befallene Beeren werden braun, lederig, schrumpfen. Gescheine: Grauschimmelaehnliche Verfaerbung.',
    damage_description: 'Blattverlust reduziert Assimilation und Holzreife. Traubenbefall (Lederbeeren) reduziert Ertrag und Qualitaet direkt. Wichtigste Rebenkrankheit in feuchten Regionen der Schweiz. Ohne Behandlung bis 80% Ernteverlust moeglich.',
    language: 'DE',
  },
  {
    id: 'echter-mehltau-reben',
    name: 'Echter Mehltau der Rebe (Oidium)',
    pest_type: 'disease',
    scientific_name: 'Erysiphe necator (syn. Uncinula necator)',
    crops_affected: ['Reben'],
    crop_category: 'rebbau',
    lifecycle: 'Ueberwinterung als Myzel in Knospen (Flaggtriebe) oder als Kleistothezien auf Rinde. Infektionen ab Austrieb. Optimum: 25-28°C, trockene Witterung, hohe Luftfeuchtigkeit genuegt.',
    identification: 'Grauweisser, mehlartiger Belag auf Blaettern, Trieben und Trauben. Befallene Beeren platzen auf (Samenbruch) bei Spätbefall. Netzartige Vernarbung auf Beeren. Schwefelig-muffiger Geruch bei starkem Befall.',
    damage_description: 'Belagsbildung auf Trauben: Qualitaetsminderung (fehlerhafter Geschmack des Weins). Aufplatzen der Beeren fördert Botrytis und Essigfäule. Ertragsverluste variabel, Qualitaetsverluste oft wichtiger als Mengenverlust.',
    language: 'DE',
  },
  {
    id: 'apfelschorf',
    name: 'Apfelschorf',
    pest_type: 'disease',
    scientific_name: 'Venturia inaequalis',
    crops_affected: ['Apfel'],
    crop_category: 'obstbau',
    lifecycle: 'Ueberwinterung als Pseudothezien im Falllaub. Ascosporen-Ausstoss im Fruehling bei Regen ab Knospenaufbruch. Primaerinfektionen April-Juni. Sekundaerzyklus durch Konidien alle 10-20 Tage. Mills-Tabelle fuer Infektionsbedingungen.',
    identification: 'Olivgruene bis braeunlich-schwarze, samtige Flecken auf Blaettern. Fruchschorf: dunkle, rissige, korkige Flecken auf Aepfeln. Fruehbefall verformt Fruechte. Spaetschorf: kleine schwarze Punkte, oft erst im Lager sichtbar (Lagerschorf).',
    damage_description: 'Befallene Fruechte nicht vermarktbar (Klasse I erfordert schorffreie Aepfel). Blattverlust schwaechtBaum. Wichtigste Apfelkrankheit in der Schweiz. Ohne Behandlung bis 100% Fruchtverlust bei anfaelligen Sorten (z.B. Gala, Golden Delicious).',
    language: 'DE',
  },
  {
    id: 'feuerbrand',
    name: 'Feuerbrand',
    pest_type: 'disease',
    scientific_name: 'Erwinia amylovora',
    crops_affected: ['Apfel', 'Birne', 'Quitte', 'Weissdorn', 'Cotoneaster'],
    crop_category: 'obstbau',
    lifecycle: 'Bakterielle Krankheit. Ueberwinterung in Rindenkanker. Aktivierung im Fruehling bei >18°C. Infektion ueber Blueten (Haupteintrittspforte), Wunden, Triebspitzen. Verbreitung durch Regen, Insekten, Werkzeug. In der Schweiz meldepflichtig.',
    identification: 'Verbogene Triebspitzen (Hirtenstabsymptom). Braune bis schwarze, welke Blueten und Blaetter, die am Baum haengen bleiben. Bakterienschleim (bernsteinfarbene Troepfchen) an befallenen Stellen. Braeunlich-roetliche Faerbung unter der Rinde.',
    damage_description: 'Kann ganze Baeume innerhalb einer Saison toeten. Meldepflicht in der Schweiz (BLV). Rodungspflicht befallener Baeume/Teile gemaess kantonaler Strategie. Existenzbedrohend fuer Obstbaubetriebe. Hochstamm-Birnbaeume besonders gefaehrdet.',
    language: 'DE',
  },
  {
    id: 'botrytis',
    name: 'Grauschimmel (Botrytis)',
    pest_type: 'disease',
    scientific_name: 'Botrytis cinerea',
    crops_affected: ['Reben', 'Erdbeeren', 'Himbeeren', 'Salat', 'Tomaten'],
    crop_category: 'rebbau',
    lifecycle: 'Allgegenwaertiger Pilz, ueberall in der Umwelt. Infektionen bei feuchter Witterung und Verletzungen (Insektenfrass, Hagel, Aufplatzen). Optimum: 15-25°C, hohe Luftfeuchtigkeit.',
    identification: 'Grauer, staubender Pilzrasen auf befallenen Organen. Trauben: Beeren werden braun, schrumpfen, grauer Belag. Sauerfaeule bei warmem Wetter. Bei spaetem, trockenem Befall an Reben: Edelfaeule (gewuenscht fuer Suess-/Dessertweine).',
    damage_description: 'Qualitaetsverluste bei Tafeltrauben und Keltertrauben. Mengenverluste bei starkem Befall. Bei Erdbeeren wichtigste Lagerkrankheit. Foerderung durch enge Pflanzen, schlechte Durchlueftung, Verletzungen.',
    language: 'DE',
  },

  // --- Weeds (Unkraeuter) ---
  {
    id: 'ackerfuchsschwanz',
    name: 'Ackerfuchsschwanz',
    pest_type: 'weed',
    scientific_name: 'Alopecurus myosuroides',
    crops_affected: ['Winterweizen', 'Wintergerste', 'Winterraps', 'Triticale'],
    crop_category: 'feldbau',
    lifecycle: 'Winterannuell. Keimung im Herbst (September-November). Ueberwinterung als Jungpflanze. Aehrenschieben April-Mai. Samenfall vor Ernte. 500-1000 Samen/Pflanze. Samen bis 5 Jahre keimfaehig im Boden.',
    identification: 'Gras, Aehre zylindrisch schmal (fuchsschwanzaehnlich), 5-10cm lang. Blaetter schmal, glatt. Blatthaehtchen lang, spitz. Jungpflanzen aufrecht, bueschelig. Wichtigstes Ungras in Winterkulturen.',
    damage_description: 'Starke Konkurrenz um Licht, Wasser und Naehrstoffe. Bei 100 Pflanzen/m2 Ertragsverluste bis 30%. Resistenzproblematik gegen Herbizide (ACCase-Hemmer, ALS-Hemmer) zunehmend in der Schweiz (Mittelland). Schwer zu bekaempfen bei Resistenz.',
    language: 'DE',
  },
  {
    id: 'windhalm',
    name: 'Windhalm',
    pest_type: 'weed',
    scientific_name: 'Apera spica-venti',
    crops_affected: ['Winterweizen', 'Wintergerste', 'Winterraps', 'Triticale'],
    crop_category: 'feldbau',
    lifecycle: 'Winterannuell. Keimung September-November, teilweise Fruehjahr. Rispe locker, ausgebreitet, bis 30cm. Samenproduktion sehr hoch (bis 10000 Samen/Pflanze). Samen 3-5 Jahre keimfaehig.',
    identification: 'Lockere, ausgebreitete Rispe (im Unterschied zu Fuchsschwanz). Blaetter rau, Blatthaehtchen lang, gezaehnt. Bestockung kraeftig. Kann grosse Horstbuendel bilden. Bei Abreife rote Faerbung der Rispe.',
    damage_description: 'Hohe Konkurrenzkraft durch starke Bestockung. Ertragsverluste bei starkem Befall bis 20-30%. Herbizidresistenz gegen ALS-Hemmer verbreitet. In leichten Boeden besonders problematisch.',
    language: 'DE',
  },
  {
    id: 'klettenlabkraut',
    name: 'Klettenlabkraut',
    pest_type: 'weed',
    scientific_name: 'Galium aparine',
    crops_affected: ['Winterweizen', 'Wintergerste', 'Winterraps', 'Sommergerste', 'Ackerbohnen'],
    crop_category: 'feldbau',
    lifecycle: 'Winterannuell (teilweise sommerannuell). Keimung Herbst und Fruehling. Rankendes Wachstum mit Kletthaken an Stengel und Fruechten. 100-400 Samen/Pflanze. Samen bis 6 Jahre keimfaehig.',
    identification: 'Quirlstaendige Blaetter (6-8 pro Quirl), lanzettlich, mit Hakenborstern. Stengel vierkantig, mit rueckwaerts gerichteten Stacheln (klettend). Fruechte kugelig mit Hakenborstern. Kann Getreide ueberranken.',
    damage_description: 'Lichtkonkurrenz durch Ueberranken des Getreides. Lager foerdernd. Ernteerschwernisse (Klettenfruchte verfilzen Erntegut). Ertragsverluste bis 25%. In Raps sehr konkurrenzstark.',
    language: 'DE',
  },
  {
    id: 'ackerkratzdistel',
    name: 'Ackerkratzdistel',
    pest_type: 'weed',
    scientific_name: 'Cirsium arvense',
    crops_affected: ['Winterweizen', 'Sommerweizen', 'Wintergerste', 'Winterraps', 'Silomais', 'Kartoffeln'],
    crop_category: 'feldbau',
    lifecycle: 'Mehrjaehrig, vegetative Vermehrung durch Wurzelauslaufer (Rhizome). Auflauf ab April. Blueht Juli-August. Windverbreitung der Samen. Rhizome koennen aus 30cm Tiefe austreiben. Sehr schwer auszurotten.',
    identification: 'Bis 150cm hoch, stachelig gezaehnte Blaetter (weniger stachelig als andere Disteln). Violette Bluetekoepfe. Nester (Horste) im Feld durch vegetative Ausbreitung. Wurzelbruchstuecke treiben aus.',
    damage_description: 'Stark konkurrierend in Nestern (Horsten). Erntebehinderung. Schwer bekaempfbar wegen tiefem Wurzelsystem. Ertragsverluste lokal in Nestern bis 50%. Verschleppung durch Bodenbearbeitung.',
    language: 'DE',
  },
  {
    id: 'hirse-arten',
    name: 'Hirse-Arten (Borstenhirse, Bluthirse, Fingerhirse)',
    pest_type: 'weed',
    scientific_name: 'Setaria spp., Digitaria sanguinalis, Echinochloa crus-galli',
    crops_affected: ['Silomais', 'Koernermais', 'Zuckerrueben', 'Kartoffeln', 'Sonnenblumen'],
    crop_category: 'feldbau',
    lifecycle: 'Sommerannuell. Keimung ab Mai bei Bodentemperatur >12-15°C. Waermeliebend. Samenproduktion sehr hoch. Zunehmende Bedeutung durch Klimaerwaermung in der Schweiz.',
    identification: 'Borstenhirse (Setaria): walzenfoermige Aehre mit Borsten. Bluthirse (Digitaria): fingerfoermig geteilte Aehre. Huehnerhirse (Echinochloa): lockere Rispe, ohne Granne oder mit Granne, kein Blatthaehtchen.',
    damage_description: 'Starke Lichtkonkurrenz in Reihenkulturen (Mais, Rueben). In Mais bei starkem Besatz Ertragsverluste bis 30%. Zunehmendes Problem durch waermere Sommer. In Zuckerrueben schwer zu bekaempfen.',
    language: 'DE',
  },
  {
    id: 'gemeines-kreuzkraut',
    name: 'Gemeines Kreuzkraut (Senecio vulgaris) / Schmalblaetriges Greiskraut',
    pest_type: 'weed',
    scientific_name: 'Senecio vulgaris',
    crops_affected: ['Gemuese', 'Kartoffeln', 'Erdbeeren', 'Baumschulen'],
    crop_category: 'gemuese',
    lifecycle: 'Ganzjaehrig keimend. Mehrere Generationen pro Jahr. Pusteblumenaehnliche Samenverbreitung. Kurze Generationszeit (6-8 Wochen).',
    identification: 'Rosettenfoermiger Wuchs, dann aufrecht bis 40cm. Gelbe Blueten ohne Zungenbluetenblatt. Fiederteilige Blaetter. Pappus (Schirmflieger) an Samen.',
    damage_description: 'Enthalt Pyrrolizidinalkaloide (PA) — gesundheitsgefaehrdend in Lebensmitteln. Grenzwerte fuer PA in Kraeutertees, Salaten, Honig. Erntegut mit Kreuzkraut-Beimischung nicht verkehrsfaehig. Zunehmende Aufmerksamkeit fuer PA-Kontamination.',
    language: 'DE',
  },
];

// ---------------------------------------------------------------------------
// 2. Treatments — Chemical, biological, cultural, mechanical
//    Sources: BLW Pflanzenschutzmittelverzeichnis, Agroscope, AGRIDEA
// ---------------------------------------------------------------------------

interface Treatment {
  pest_id: string;
  approach: 'chemical' | 'biological' | 'cultural' | 'mechanical';
  product_name: string | null;
  active_substance: string | null;
  w_number: string | null;
  dosage: string | null;
  waiting_period: string | null;
  timing: string | null;
  restrictions: string | null;
  pufferstreifen: string | null;
  notes: string | null;
}

const treatments: Treatment[] = [
  // Blattlaeuse treatments
  {
    pest_id: 'blattlaeuse', approach: 'chemical', product_name: 'Pirimicarb (div. Produkte)',
    active_substance: 'Pirimicarb', w_number: 'W-5439', dosage: '0.3 kg/ha',
    waiting_period: '21 Tage', timing: 'Ab Schadschwelle (60% befallene Halme, BBCH 51-69)',
    restrictions: 'OELN: Schadschwelle einhalten. Max. 2 Behandlungen/Saison.', pufferstreifen: '6m (Standard OELN)',
    notes: 'Selektiv — schont Nuetzlinge (Marienkaefer, Schwebfliegen, Schlupfwespen).',
  },
  {
    pest_id: 'blattlaeuse', approach: 'biological', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: 'Praventiv und begleitend',
    restrictions: null, pufferstreifen: null,
    notes: 'Nuetzlingsfoerderung: Marienkaefer (Coccinella), Florfliegenlarven (Chrysoperla), Schlupfwespen (Aphidius). Bluestreifen und Nuetzlingsstreifen anlegen. Extenso-Anbau verzichtet auf Insektizide.',
  },
  {
    pest_id: 'blattlaeuse', approach: 'cultural', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: 'Vor Aussaat und waehrend Vegetation',
    restrictions: null, pufferstreifen: null,
    notes: 'Resistente Sorten waehlen (BYDV-tolerant). Spaetere Aussaat im Herbst (reduziert Virusinfektionen). Saatgutbeizung gegen Herbstbefall. Stickstoffduengung nicht uebertreiben (foerdert Massenentwicklung).',
  },

  // Getreidehaehnchen treatments
  {
    pest_id: 'getreidehaehnchen', approach: 'chemical', product_name: 'Lambda-Cyhalothrin (div. Produkte)',
    active_substance: 'Lambda-Cyhalothrin', w_number: 'W-6542', dosage: '0.075 L/ha',
    waiting_period: '30 Tage', timing: 'Bei Schadschwelle: 1-1.5 Eier oder Larven/Halm (BBCH 37-59)',
    restrictions: 'OELN: Schadschwelle zwingend. Breitbandinsektizid — toetet Nuetzlinge.', pufferstreifen: '20m (SPe 3 Auflage)',
    notes: 'Pyrethroid. Nur bei sicherem Ueberschreiten der Schadschwelle. Extenso: kein Insektizideinsatz.',
  },
  {
    pest_id: 'getreidehaehnchen', approach: 'biological', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: null,
    restrictions: null, pufferstreifen: null,
    notes: 'Natuerliche Gegenspieler: Eiparasiten (Anaphes spp.), Larvenparasiten, Laufkaefer. Bei normaler Nuetzlingsaktivitaet selten Bekaempfung noetig. Extenso-Anbau setzt auf natuerliche Regulation.',
  },

  // Rapsglanzkaefer treatments
  {
    pest_id: 'rapsglanzkaefer', approach: 'chemical', product_name: 'Biscaya (Thiacloprid) — Bewilligung endend',
    active_substance: 'Thiacloprid / Acetamiprid (als Alternative)', w_number: 'W-6789', dosage: '0.3 L/ha',
    waiting_period: '30 Tage', timing: 'Ab Schadschwelle: 3-5 Kaefer/Haupttrieb im Knospenstadium (BBCH 51-59). SOPRA-Prognose beachten.',
    restrictions: 'Nicht in offener Bluete (Bienenschutz). OELN: Schadschwelle einhalten. Neonicotinoid-Einschraenkungen beachten.',
    pufferstreifen: '6m (Standard), je nach Produkt 20m',
    notes: 'SOPRA-Prognose (Agroscope) nutzen fuer Zuflugzeitpunkt. Resistenzmanagement: Wirkstoffwechsel. In Bluete keine Insektizide (Bestauber!).',
  },
  {
    pest_id: 'rapsglanzkaefer', approach: 'biological', product_name: 'Spinosad-Praeparate',
    active_substance: 'Spinosad', w_number: 'W-7012', dosage: 'Produktspezifisch',
    waiting_period: 'Produktspezifisch', timing: 'Wie chemisch, Knospenstadium',
    restrictions: 'Bio-zugelassen (FiBL-Betriebsmittelliste)', pufferstreifen: '6m',
    notes: 'Alternative fuer Bio-Betriebe. Wirkung langsamer als Pyrethroide. Abends behandeln (Bestaeuberschutz).',
  },
  {
    pest_id: 'rapsglanzkaefer', approach: 'cultural', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: null,
    restrictions: null, pufferstreifen: null,
    notes: 'Fruehe Sorten (schnelle Bluete) entkommen Schaden. Kraeftige Rapsbestaende tolerieren mehr Knospenfrass. Fangpflanzen (Ruebsen) am Feldrand. Stoppelbearbeitung gegen Ueberwinterung.',
  },

  // Kartoffelkaefer treatments
  {
    pest_id: 'kartoffelkaefer', approach: 'chemical', product_name: 'Audienz (Spinosad)',
    active_substance: 'Spinosad', w_number: 'W-6523', dosage: '0.2 L/ha',
    waiting_period: '7 Tage', timing: 'Bei 2 Larven/Staude oder 20% befallene Stauden. Junge Larvenstadien (L1-L2) am empfindlichsten.',
    restrictions: 'Max. 3 Behandlungen/Kultur. OELN: Schadschwelle beachten.', pufferstreifen: '6m',
    notes: 'Spinosad auch fuer Bio zugelassen. Alternative: Novodor (Bacillus thuringiensis var. tenebrionis).',
  },
  {
    pest_id: 'kartoffelkaefer', approach: 'biological', product_name: 'Novodor FC (Bt tenebrionis)',
    active_substance: 'Bacillus thuringiensis subsp. tenebrionis', w_number: 'W-5678', dosage: '5 L/ha',
    waiting_period: '0 Tage', timing: 'Gegen junge Larven (L1-L2). Frassaktivitaet noetig.',
    restrictions: 'Temperatur >15°C fuer Wirksamkeit. UV-empfindlich — abends behandeln.', pufferstreifen: '6m',
    notes: 'Bio-Standard bei Kartoffelkaefer-Bekaempfung. 2-3 Behandlungen im Abstand von 7-10 Tagen.',
  },
  {
    pest_id: 'kartoffelkaefer', approach: 'mechanical', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: 'Laufend waehrend Befallsperiode',
    restrictions: null, pufferstreifen: null,
    notes: 'Absammeln (Kleinstflaechen). Flammjaeten der Eigelege. Netzabdeckung gegen Zuflug. Auf kleinen Flaechen wirtschaftlich vertretbar.',
  },

  // Krautfaeule treatments
  {
    pest_id: 'krautfaeule', approach: 'chemical', product_name: 'Revus (Mandipropamid)',
    active_substance: 'Mandipropamid', w_number: 'W-6834', dosage: '0.6 L/ha',
    waiting_period: '7 Tage', timing: 'Praeventiv ab BBCH 31 oder bei PhytoPRE-Warnung. Spritzintervall 7-10 Tage bei Infektionsgefahr.',
    restrictions: 'OELN: Prognosesystem PhytoPRE (Agroscope) nutzen. Resistenzmanagement: Wirkstoffwechsel bei Spritzfolge.',
    pufferstreifen: '6m',
    notes: 'Protektiv (vorbeugend). PhytoPRE zeigt Infektionsperioden — Behandlung 1-2 Tage VOR Infektion. 8-12 Behandlungen/Saison bei anfaelligen Sorten. Kombination Kontakt + systemisch.',
  },
  {
    pest_id: 'krautfaeule', approach: 'chemical', product_name: 'Kupferpraeparate (div.)',
    active_substance: 'Kupferhydroxid / Kupferoxychlorid', w_number: 'W-diverse', dosage: 'Max. 4 kg Cu/ha/Jahr',
    waiting_period: 'Produktspezifisch', timing: 'Praeventiv, wie synthetische Fungizide',
    restrictions: 'Max. 4 kg Reinkupfer/ha/Jahr (Bio Suisse). Kumulation im Boden beachten.', pufferstreifen: '20m (SPe 3)',
    notes: 'Einziges im Bio zugelassenes Fungizid gegen Krautfaeule. Kontaktwirkung, kein Regenfestigkeit. Kupferreduktion ist Ziel des Aktionsplans PSM.',
  },
  {
    pest_id: 'krautfaeule', approach: 'cultural', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: null,
    restrictions: null, pufferstreifen: null,
    notes: 'Resistente/tolerante Sorten (z.B. Agria, Innovator — weniger anfaellig). Gesundes, zertifiziertes Pflanzgut. Durchwuchskartoffeln und Abfallhaufen entfernen. Fruchtfolge min. 4 Jahre. Krautvernichtung 2-3 Wochen vor Ernte.',
  },

  // Septoria treatments
  {
    pest_id: 'septoria', approach: 'chemical', product_name: 'Elatus Era (Solatenol + Prothioconazol)',
    active_substance: 'Benzovindiflupyr + Prothioconazol', w_number: 'W-7234', dosage: '0.75 L/ha',
    waiting_period: '35 Tage', timing: 'T2-Behandlung: BBCH 39-49 (Fahnenblatt). Bei Befall unterer Blaetter + Regen/feuchte Prognose.',
    restrictions: 'OELN: Schadschwellenprinzip. Extenso: kein Fungizideinsatz. Max. 1 SDHI + 1 Azol/Saison (Resistenzmanagement).',
    pufferstreifen: '6m',
    notes: 'Wichtigste Fungizidbehandlung im Weizen (T2 auf Fahnenblatt). Sortenresistenz nutzen: IG-Getreide Sortenliste beachten (Resistenznoten 1-9, Note >7 reduziert Fungizid-Bedarf).',
  },
  {
    pest_id: 'septoria', approach: 'cultural', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: null,
    restrictions: null, pufferstreifen: null,
    notes: 'Resistente Sorten (Septoria-Resistenznote >6 gemaess empfohlener Sortenliste). Stoppelbearbeitung: Ernterueckstaende einarbeiten. Fruchtfolge: Weizen nicht nach Weizen. Saatstaerke und N-Duengung anpassen (dichte Bestaende foerdern Feuchtigkeit).',
  },

  // Fusarium treatments
  {
    pest_id: 'fusarium', approach: 'chemical', product_name: 'Prosaro/Proline (Prothioconazol)',
    active_substance: 'Prothioconazol', w_number: 'W-6901', dosage: '0.8-1.0 L/ha',
    waiting_period: '35 Tage', timing: 'Bluetebehandlung (BBCH 61-65). Nur bei FusaProg-Warnung und Risikosituation (Mais-Vorfrucht + Mulchsaat + anfaellige Sorte + feuchte Bluete).',
    restrictions: 'OELN: nur bei begruendetem Risiko. Extenso: kein Fungizid.', pufferstreifen: '6m',
    notes: 'Timing kritisch: Behandlung muss WAEHREND der Weizenbluetefenster erfolgen. FusaProg (Agroscope) berechnet Infektionsrisiko aus Vorfrucht + Bodenbearbeitung + Sorte + Witterung.',
  },
  {
    pest_id: 'fusarium', approach: 'cultural', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: null,
    restrictions: null, pufferstreifen: null,
    notes: 'WICHTIGSTE MASSNAHME: Maisstoppeln zerkleinern und einarbeiten (gruendlicher Pflug oder Mulchen + Einarbeiten). Kein Weizen nach Mais in Direktsaat. Resistente Sorten (FHB-Resistenz Note >6). Fruchtfolge diversifizieren. Getreidezuchtfortschritt nutzen.',
  },

  // Falscher Mehltau Reben treatments
  {
    pest_id: 'falscher-mehltau-reben', approach: 'chemical', product_name: 'Folpet-Praeparate + systemische Fungizide',
    active_substance: 'Folpet + Metalaxyl-M / Cymoxanil / Ametoctradin', w_number: 'W-diverse', dosage: 'Produktspezifisch',
    waiting_period: '21-35 Tage', timing: 'Ab 3-Blattstadium, Spritzintervall 8-12 Tage je nach Infektionsdruck. VitiMeteo-Prognose nutzen.',
    restrictions: 'OELN: max. 7-10 Behandlungen/Saison. Resistenzmanagement: Wirkstoffgruppen abwechseln.', pufferstreifen: '6m-20m je nach Produkt',
    notes: 'Spritzfolge aus Kontakt (Folpet, Kupfer) + systemisch (Metalaxyl, Cymoxanil) + translaminar (Ametoctradin). VitiMeteo Prognose nutzen. Antrocknung beachten (Regenbestaendigkeit).',
  },
  {
    pest_id: 'falscher-mehltau-reben', approach: 'cultural', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: null,
    restrictions: null, pufferstreifen: null,
    notes: 'Laubarbeit: gute Durchlueftung der Traubenzone (Entblaettern). Pilzwiderstandsfaehige Sorten (PIWI): Divico, Divona, Cabernet Jura, Johanniter, Souvignier gris — Fungizideinsatz um 50-80% reduzierbar. Falllaub entfernen oder mulchen.',
  },

  // Ackerfuchsschwanz treatments
  {
    pest_id: 'ackerfuchsschwanz', approach: 'chemical', product_name: 'Axial (Pinoxaden)',
    active_substance: 'Pinoxaden', w_number: 'W-6712', dosage: '0.45-0.9 L/ha',
    waiting_period: 'Nicht relevant (Herbizid)', timing: 'Nachlauf Herbst (BBCH 11-25 des Ungrases) oder Fruehling (BBCH 21-29)',
    restrictions: 'OELN: nur zugelassene Produkte. Resistenzrisiko: ACCase-Hemmer-Resistenz verbreitet.', pufferstreifen: '6m',
    notes: 'ACCase-Hemmer. Bei Resistenzverdacht: ALS-Hemmer (Atlantis: Mesosulfuron + Iodosulfuron) oder Vorlauf-Herbizide (Flufenacet). Resistenztest durch kantonale Fachstelle. Herbizidresistenz ist zunehmendes Problem im Schweizer Mittelland.',
  },
  {
    pest_id: 'ackerfuchsschwanz', approach: 'cultural', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: null,
    restrictions: null, pufferstreifen: null,
    notes: 'WICHTIGSTE MASSNAHME bei Resistenz: Fruchtfolge auflockern (Sommerungen einbauen — Sommergerste, Ackerbohnen, Mais). Pflugeinsatz alle 3-4 Jahre (versetzt Samen in tiefere Schichten). Falsche Saatbetten (Keimung provozieren, dann bekaempfen). Spätere Herbstsaat.',
  },

  // Klettenlabkraut treatments
  {
    pest_id: 'klettenlabkraut', approach: 'chemical', product_name: 'Biathlon 4D (Tritosulfuron + Florasulam)',
    active_substance: 'Tritosulfuron + Florasulam', w_number: 'W-7101', dosage: '70 g/ha',
    waiting_period: 'Nicht relevant (Herbizid)', timing: 'Nachlauf Fruehling, BBCH 13-31 des Getreides',
    restrictions: 'OELN: nur zugelassene Herbizide.', pufferstreifen: '6m',
    notes: 'Gute Labkraut-Wirkung. Kann mit Grasungras-Herbizid gemischt werden. Extenso: Herbizideinsatz erlaubt.',
  },

  // Ackerkratzdistel treatments
  {
    pest_id: 'ackerkratzdistel', approach: 'chemical', product_name: 'Lontrel / Cliophar (Clopyralid)',
    active_substance: 'Clopyralid', w_number: 'W-5234', dosage: '0.5-1.0 L/ha',
    waiting_period: 'Produktspezifisch', timing: 'Im Mais ab BBCH 14. In Getreide: MCPA oder Wuchsstoff-Kombination.',
    restrictions: 'Kompostierungsregel: Clopyralid persistent in Kompost — Nachkultur beachten.', pufferstreifen: '6m',
    notes: 'Wuchsstoff-Herbizide (MCPA, 2,4-D, Clopyralid) wirken systemisch in die Wurzel. Wiederholte Behandlung noetig (mehrjaehrig). In Raps: keine selektive Distel-Bekaempfung moeglich.',
  },
  {
    pest_id: 'ackerkratzdistel', approach: 'mechanical', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: 'Wiederholtes Abschneiden waehrend Vegetation',
    restrictions: null, pufferstreifen: null,
    notes: 'Wiederholtes Abschneiden/Abmaehen (4-6x/Jahr) erschoepft Wurzelreserven. Nie bluehen lassen. Ganzflaechige Stoppelbearbeitung nach Ernte. Bio: wichtigste Massnahme — Gruendlicher Anbau von Kunstwiese in Fruchtfolge (Schnittdruck).',
  },

  // Apfelschorf treatments
  {
    pest_id: 'apfelschorf', approach: 'chemical', product_name: 'Captan/Delan (div. Kontaktfungizide)',
    active_substance: 'Captan / Dithianon / Dodine', w_number: 'W-diverse', dosage: 'Produktspezifisch',
    waiting_period: '14-21 Tage', timing: 'Praeventiv ab Austrieb. Mills-Tabelle: Infektionsbedingungen (Temperatur + Blattnassdauer). 10-15 Behandlungen/Saison bei anfaelligen Sorten.',
    restrictions: 'OELN: Prognosemethode empfohlen. Max. Kupfer im Bio: 4 kg/ha/Jahr.', pufferstreifen: '6m-20m',
    notes: 'Kontaktfungizide vor Regen (protektiv), kurative Produkte nach Infektion (48h-Fenster). Schorfresistente Sorten (Vf-Resistenz: Topaz, Florina, GoldRush) reduzieren Behandlungsbedarf massiv.',
  },

  // Apfelwickler treatments
  {
    pest_id: 'apfelwickler', approach: 'biological', product_name: 'Granulovirus CpGV (div. Praeparate)',
    active_substance: 'Cydia pomonella Granulovirus (CpGV)', w_number: 'W-6234', dosage: 'Produktspezifisch',
    waiting_period: '0 Tage', timing: 'Ab Eigelege der 1. Generation, 2-3 Behandlungen im Abstand von 8-14 Tagen',
    restrictions: 'Bio-Standard im Obstbau.', pufferstreifen: 'Keine',
    notes: 'Spezifisch gegen Apfelwickler-Larven. Hauptmethode im Bio-Obstbau. Kombiniert mit Verwirrungstechnik (Pheromone). Resistenz gegen CpGV in einzelnen Populationen beobachtet — Abwechslung mit CpGV-Isolaten.',
  },
  {
    pest_id: 'apfelwickler', approach: 'cultural', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: null,
    restrictions: null, pufferstreifen: null,
    notes: 'Verwirrungstechnik (Pheromone, Isomate C Plus): grossflaechig einsetzen (>2 ha zusammenhaengend). Wellpappeguerteln um Stamm (Larven fangen, entfernen). Befallene Fruechte absammeln (Junifruchtfall). Hygiene: Aufsammeln und Entfernen wurmstichiger Aepfel.',
  },

  // Hirse treatments
  {
    pest_id: 'hirse-arten', approach: 'chemical', product_name: 'Dual Gold (S-Metolachlor)',
    active_substance: 'S-Metolachlor', w_number: 'W-5901', dosage: '1.5 L/ha',
    waiting_period: 'Nicht relevant (Vorlauf)', timing: 'Vorlauf (vor Auflauf Hirse), Mais BBCH 10-14',
    restrictions: 'OELN: zugelassene Produkte. Grundwasserschutz beachten (Metabolit).', pufferstreifen: '6m-20m',
    notes: 'Vorlauf-Bodenherbizid. Wirkung abhaengig von Bodenfeuchtigkeit. Alternative Nachlauf: Nicosulfuron (aber Resistenz moeglich). Mechanische Bekaempfung als Ergaenzung.',
  },
  {
    pest_id: 'hirse-arten', approach: 'mechanical', product_name: null,
    active_substance: null, w_number: null, dosage: null,
    waiting_period: null, timing: 'Ab Auflauf der Hirse, 2-3 Durchgaenge',
    restrictions: null, pufferstreifen: null,
    notes: 'Hackgeraet in Reihenkulturen (Mais, Rueben): 2-3 Durchgaenge im Abstand von 10-14 Tagen. Fingerhaecker oder Rollhacke. In Bio-Anbau Standard. Striegeln in Getreide wenig wirksam gegen Hirse.',
  },
];

// ---------------------------------------------------------------------------
// 3. IPM Guidance — Schadschwellen, Monitoring, Prognosesysteme
//    Sources: Agroscope Schadschwellen, OELN-Richtlinien, AGRIDEA
// ---------------------------------------------------------------------------

interface IpmGuidance {
  crop: string;
  crop_category: string;
  pest_id: string;
  threshold: string;
  monitoring_method: string;
  cultural_controls: string;
  prognose_system: string | null;
  oeln_requirements: string;
  notes: string | null;
}

const ipmGuidance: IpmGuidance[] = [
  {
    crop: 'Winterweizen', crop_category: 'feldbau', pest_id: 'blattlaeuse',
    threshold: '60% befallene Halme oder Aehren (BBCH 51-69). Alternativ: >5 Blattlaeuse/Aehre bei Stichprobenbonitierung (40 Halme).',
    monitoring_method: 'Stichprobenbonitierung: 4x10 Halme in W-Form durchs Feld. Blaetter und Aehren auf Besatz kontrollieren. Nuetzlingsbesatz (Marienkaefer, Schwebfliegen) ebenfalls erfassen.',
    cultural_controls: 'Nuetzlingsfoerderung durch Bluestreifen und Oekoflächen. Kein uebermaessiger N-Einsatz. BYDV-tolerante Sorten. Spaetere Herbstsaat gegen Virusvektoren.',
    prognose_system: null,
    oeln_requirements: 'Schadschwelle muss dokumentiert ueberschritten sein vor Insektizideinsatz. Extenso: kein Insektizideinsatz erlaubt. Feldbuch-Eintrag obligatorisch.',
    notes: 'Nuetzlinge beachten: bei >1 Nuetzling pro 5 Blattlaeuse kann auf Behandlung verzichtet werden (natuerliche Regulation).',
  },
  {
    crop: 'Winterweizen', crop_category: 'feldbau', pest_id: 'getreidehaehnchen',
    threshold: '1-1.5 Eier oder Larven pro Halm (Durchschnitt 40 Halme, BBCH 37-59). Alternativ: 0.5-1 Larve/Fahnenblatt.',
    monitoring_method: 'Stichprobenbonitierung: 4x10 Halme. Eier (gelblich) und Larven (mit Kotkruemeln) zaehlen. Fensterfrass-Anteil auf Fahnenblatt schaetzen.',
    cultural_controls: 'Sortenunterschiede beachten (behaarte Sorten weniger befallen). Extenso: natuerliche Regulation meist ausreichend.',
    prognose_system: null,
    oeln_requirements: 'Schadschwelle muss dokumentiert ueberschritten sein. Feldbuch-Eintrag.',
    notes: null,
  },
  {
    crop: 'Winterweizen', crop_category: 'feldbau', pest_id: 'septoria',
    threshold: 'Vorbeugend bei feuchter Witterung: wenn obere 3 Blaetter betroffen und Regen prognostiziert. Sortenresistenz als erste Massnahme.',
    monitoring_method: 'Bonitur der oberen 3 Blaetter (F, F-1, F-2) auf Symptome. Bei >30% Blattflaeche befallen auf F-2 und feuchter Prognose: Behandlung erwaegen.',
    cultural_controls: 'Resistente Sorten (Septoria-Note >6, IG-Getreide Empfehlungsliste). Stoppelbearbeitung. Fruchtfolge (kein Weizen-Weizen). Angepasste N-Duengung und Saastaerke.',
    prognose_system: null,
    oeln_requirements: 'Extenso: kein Fungizideinsatz. OELN: Begruendung fuer Fungizid noetig.',
    notes: 'Entscheidend ist der Schutz des Fahnenblatts (T2-Termin, BBCH 39-49). Fruehe Behandlung (T1) oft nicht ertragsrelevant.',
  },
  {
    crop: 'Winterweizen', crop_category: 'feldbau', pest_id: 'fusarium',
    threshold: 'Risikobewertung statt Schadschwelle. FusaProg berechnet Infektionsrisiko aus: Vorfrucht + Bodenbearbeitung + Sortenresistenz + Witterung waehrend Bluete.',
    monitoring_method: 'FusaProg (fusaprog.ch): Online-Tool, schlagspezifische Risikobewertung. Regionaler Sporenflug via Sporenfallen (Agroscope).',
    cultural_controls: 'WICHTIGSTE MASSNAHME: Mais-Stoppelmanagement (zerkleinern + einarbeiten). Kein Weizen nach Mais ohne Pflug. Resistente Sorten (FHB-Resistenz). Fruchtfolge diversifizieren.',
    prognose_system: 'FusaProg (Agroscope/Meteotest) — fusaprog.ch',
    oeln_requirements: 'Extenso: kein Fungizideinsatz. Fungizid nur bei hohem Risiko (FusaProg) und anfaelliger Sorte. Mykotoxin-Grenzwerte beachten (DON 1250 µg/kg Mehl).',
    notes: 'Achtung Maisstaerkezunahme in CH: Fusarium-Risiko steigt mit Maisanteil in Fruchtfolge. Pflugloser Anbau nach Mais erhoht Risiko 3-5x.',
  },
  {
    crop: 'Winterraps', crop_category: 'feldbau', pest_id: 'rapsglanzkaefer',
    threshold: '3-5 Kaefer pro Haupttrieb im Knospenstadium (BBCH 51-59). Bei starken Rapsbestaenden hoehere Toleranz (5-8 Kaefer).',
    monitoring_method: 'Gelbschalen am Feldrand (1-2 pro Feld) fuer Zuflugmonitoring. Sichtkontrolle: 20 Pflanzen aus 4 Stellen — Kaefer pro Haupttrieb zaehlen.',
    cultural_controls: 'Kraeftige Rapsbestaende (gute Herbstentwicklung). Fruehe Sorten. Rapse am Feldrand als Fangstreifen.',
    prognose_system: 'SOPRA (Agroscope) — sopra.info',
    oeln_requirements: 'OELN: Schadschwelle dokumentieren. Gelbschale empfohlen. Bienenschutz: keine Insektizide in offener Bluete.',
    notes: 'SOPRA-Prognose nutzen: zeigt Zuflugzeitpunkt regional an. Ab Bluete (BBCH 60) keine Bekaempfung mehr noetig (offene Blueten — Pollen frei zugaenglich).',
  },
  {
    crop: 'Kartoffeln', crop_category: 'feldbau', pest_id: 'kartoffelkaefer',
    threshold: '2 Larven/Staude (Durchschnitt aus 40 Pflanzen) oder 20% befallene Stauden. Bei Junglarven (L1-L2) groessere Wirkung der Bekaempfung.',
    monitoring_method: 'Schlagkontrolle: 4x10 Pflanzen in W-Form. Kaefer, Eipakete und Larven zaehlen. Befallsgrad (% Stauden) und Intensitaet (Larven/Staude) erfassen.',
    cultural_controls: 'Fruchtfolge mind. 4 Jahre. Durchwuchskartoffeln entfernen. Sorten ohne spezifische Resistenz — aber unterschiedliche Blatttracht (dichte Blaetter erschwerend).',
    prognose_system: null,
    oeln_requirements: 'Schadschwelle muss dokumentiert sein. Bio: Bt oder Spinosad zugelassen.',
    notes: null,
  },
  {
    crop: 'Kartoffeln', crop_category: 'feldbau', pest_id: 'krautfaeule',
    threshold: 'Keine klassische Schadschwelle — praeventive Strategie. PhytoPRE zeigt Infektionsperioden. Erste Behandlung ab BBCH 31 oder bei erster PhytoPRE-Warnung.',
    monitoring_method: 'PhytoPRE (Agroscope): Online-Tool, regionsspezifische Infektionswarnungen auf Basis von Wetterdaten und Modellberechnung. Visuelle Kontrolle auf ersten Befall im Feld.',
    cultural_controls: 'Gesundes Pflanzgut. Durchwuchskartoffeln und Abfallhaufen entfernen (Primaerinfektionsquellen). Resistente/tolerante Sorten (z.B. Agria, Innovator). Krautvernichtung 2-3 Wochen vor Ernte.',
    prognose_system: 'PhytoPRE (Agroscope) — phytopre.ch',
    oeln_requirements: 'OELN: Prognosesystem empfohlen. Behandlungsindex dokumentieren. Bio: nur Kupferpraeparate (max. 4 kg Cu/ha/Jahr).',
    notes: 'Wichtigste Krankheit: 8-12 Behandlungen/Saison bei anfaelligen Sorten. Bei resistenten Sorten + PhytoPRE: 3-6 Behandlungen moeglich. Spritzdruck in feuchten Jahren sehr hoch.',
  },
  {
    crop: 'Reben', crop_category: 'rebbau', pest_id: 'falscher-mehltau-reben',
    threshold: 'Keine Schadschwelle — praeventive Strategie ab 3-Blattstadium. VitiMeteo zeigt Infektionsperioden (Primaer- und Sekundaerinfektionen).',
    monitoring_method: 'VitiMeteo (vitimeteo.info): Infektionsmodell auf Basis Blattnassdauer + Temperatur. Visuelle Kontrolle auf Oelflecken an den unteren Blaettern.',
    cultural_controls: 'PIWI-Sorten (Pilzwiderstandsfaehige Sorten): Divico, Divona, Cabernet Jura, Souvignier gris — 50-80% weniger Fungizid. Laubarbeit (Entblaettern Traubenzone). Falllaub entfernen/mulchen.',
    prognose_system: 'VitiMeteo (Agroscope/Changins) — vitimeteo.info',
    oeln_requirements: 'OELN: Prognose empfohlen. Bio: Kupfer max. 4 kg/ha/Jahr + Schwefelpraeparate.',
    notes: 'PIWI-Sorten sind der wichtigste Hebel zur PSM-Reduktion im Schweizer Rebbau. Aktionsplan PSM fordert Sortenerneuerung. Deutschschweiz zunehmend PIWI-Pflanzungen.',
  },
  {
    crop: 'Reben', crop_category: 'rebbau', pest_id: 'echter-mehltau-reben',
    threshold: 'Keine Schadschwelle — praeventive Strategie parallel zum Peronospora-Programm. Schwefelpraeparate ab Austrieb.',
    monitoring_method: 'Visuelle Bonitur auf mehlartigen Belag. Fruehe Flaggtriebe (Myzel in Knospen) markieren Infektionsherd. VitiMeteo Oidium-Modul.',
    cultural_controls: 'PIWI-Sorten (resistent gegen beide Mehltau-Arten). Laubarbeit (Durchlueftung). Flaggtriebe sofort entfernen.',
    prognose_system: 'VitiMeteo (Agroscope) — vitimeteo.info',
    oeln_requirements: 'Bio: Netzschwefel zugelassen (20-50 g/L Schwefel). Kaliumbicarbonat als Alternative.',
    notes: 'Schwefelpraeparate wirken gleichzeitig gegen Oidium und teilweise Milben. PIWI-Sorten reduzieren Behandlungsbedarf auf 0-2 Behandlungen.',
  },
  {
    crop: 'Apfel', crop_category: 'obstbau', pest_id: 'apfelschorf',
    threshold: 'Keine Schadschwelle — praeventive Strategie gemaess Mills-Tabelle (Blattnassdauer + Temperatur = Infektionsbedingungen).',
    monitoring_method: 'Wetterdaten (Blattnasssensor, Temperatur): Mills-Tabelle bestimmt ob Infektion stattgefunden hat. Visuelle Bonitur auf Erstbefall (Oelflecke, dann Sporulation).',
    cultural_controls: 'Schorfresistente Sorten (Vf-Resistenz): Topaz, Florina, GoldRush, Ladina — 0-3 Behandlungen statt 10-15. Falllaub mulchen/haeckseln (Ascosporen-Reduktion). Schnitt fuer Durchlueftung.',
    prognose_system: null,
    oeln_requirements: 'Bio: Schwefel + Kupfer (max. 1.5 kg Cu/ha/Jahr Kernobst). Tonerde (Myco-Sin) als Alternative.',
    notes: 'Schweizer Obstbau-Branche foerdert resistente Sorten. Sortenumstellung reduziert PSM-Einsatz um 70-80%.',
  },
  {
    crop: 'Apfel', crop_category: 'obstbau', pest_id: 'apfelwickler',
    threshold: '5 Falter/Falle (Pheromonfalle) pro Woche als Indikator fuer Behandlungsbedarf. Hauptflug ab Mai (1. Gen) und Juli/August (2. Gen).',
    monitoring_method: 'Pheromonfallen (1-2 pro Parzelle): woechentliche Zaehlung der Maennchen. Temperatursummenmodell fuer Entwicklung. Visuelle Fruchtbonitur ab Juni.',
    cultural_controls: 'Verwirrungstechnik (Pheromone, grossflaechig >2 ha). Wellpappeguerteln am Stamm (Larven fangen). Befallene Fruechte entfernen (Junifruchtfall, Erntereste). Nistkasten fuer Meisenfoerderung.',
    prognose_system: null,
    oeln_requirements: 'Bio: CpGV (Granulovirus) + Verwirrungstechnik. Kein Einsatz von Organophosphaten.',
    notes: 'Verwirrungstechnik + CpGV ist Standard im Schweizer Bio-Obstbau und zunehmend auch im IP-Obstbau.',
  },
  {
    crop: 'Silomais', crop_category: 'feldbau', pest_id: 'maiszuensler',
    threshold: 'Keine klassische Schadschwelle. Behandlung bei regional bekanntem Zuensler-Druck (>20% befallene Stengel in Vorjahr).',
    monitoring_method: 'Lichtfallen und Pheromonfallen fuer Flugmonitoring. Visuelle Bonitur: Bohrmehl an Blattachseln, Stengelbruch, Kolbenabknickung. Nachernteerhebung: aufgeschnittene Stengel.',
    cultural_controls: 'WICHTIGSTE MASSNAHME: Gruendliche Zerkleinerung der Maisstoppeln nach Ernte (Haecksler, Mulcher). Tiefes Unterpfluegen. Fruchtfolge (kein Mais nach Mais). Trichogramma-Einsatz als biologische Bekaempfung.',
    prognose_system: null,
    oeln_requirements: 'OELN: Stoppelbearbeitung nach Mais obligatorisch in Zuenslergebieten. Trichogramma zugelassen.',
    notes: 'Trichogramma-Schlupfwespen (Kugeln/Karten in Mais aufhaengen): freilassung gegen Eier. In der Schweiz zunehmend eingesetzt. Wichtig fuer Fusarium-Praevention (Zuensler-Bohrloecher = Eintrittspforte).',
  },
];

// ---------------------------------------------------------------------------
// 4. Approved Products — BLW Pflanzenschutzmittelverzeichnis (representative)
//    Source: psm.admin.ch
// ---------------------------------------------------------------------------

interface ApprovedProduct {
  w_number: string;
  product_name: string;
  active_substance: string;
  product_type: string;
  crops: string;
  target_organisms: string;
  auflagen: string;
  wartefrist: string;
  dosage: string;
  application_method: string;
  spe3_buffer: string | null;
  aktionsplan_status: string;
}

const approvedProducts: ApprovedProduct[] = [
  {
    w_number: 'W-7234', product_name: 'Elatus Era', active_substance: 'Benzovindiflupyr + Prothioconazol',
    product_type: 'Fungizid', crops: 'Weizen, Gerste, Triticale, Roggen',
    target_organisms: 'Septoria, Braunrost, Gelbrost, DTR, Netzflecken',
    auflagen: 'Max. 1x SDHI pro Saison (Resistenzmanagement)', wartefrist: '35 Tage', dosage: '0.75 L/ha',
    application_method: 'Spritzen', spe3_buffer: null, aktionsplan_status: 'Zugelassen',
  },
  {
    w_number: 'W-6901', product_name: 'Prosaro', active_substance: 'Prothioconazol + Tebuconazol',
    product_type: 'Fungizid', crops: 'Weizen, Gerste, Triticale, Raps',
    target_organisms: 'Septoria, Fusarium, Braunrost, Phoma',
    auflagen: 'Max. 2 Azol-Behandlungen/Kultur', wartefrist: '35 Tage', dosage: '0.8-1.0 L/ha',
    application_method: 'Spritzen', spe3_buffer: null, aktionsplan_status: 'Zugelassen',
  },
  {
    w_number: 'W-6834', product_name: 'Revus', active_substance: 'Mandipropamid',
    product_type: 'Fungizid', crops: 'Kartoffeln, Tomaten',
    target_organisms: 'Kraut- und Knollenfaeule (Phytophthora infestans)',
    auflagen: 'Max. 4x/Kultur, Spritzfolge mit Kontaktmittel', wartefrist: '7 Tage', dosage: '0.6 L/ha',
    application_method: 'Spritzen', spe3_buffer: null, aktionsplan_status: 'Zugelassen',
  },
  {
    w_number: 'W-5439', product_name: 'Pirimicarb (Pirimor)', active_substance: 'Pirimicarb',
    product_type: 'Insektizid', crops: 'Getreide, Kartoffeln, Rueben, Gemuese',
    target_organisms: 'Blattlaeuse',
    auflagen: 'Selektiv, schont Nuetzlinge. Max. 2x/Kultur.', wartefrist: '21 Tage', dosage: '0.3 kg/ha',
    application_method: 'Spritzen', spe3_buffer: null, aktionsplan_status: 'Zugelassen',
  },
  {
    w_number: 'W-6523', product_name: 'Audienz', active_substance: 'Spinosad',
    product_type: 'Insektizid', crops: 'Kartoffeln, Gemuese, Obst, Reben',
    target_organisms: 'Kartoffelkaefer, Thripse, Traubenwickler, diverse Raupen',
    auflagen: 'Bio-tauglich (FiBL-Betriebsmittelliste). Max. 3x/Kultur. Abends behandeln (Bienenschutz).',
    wartefrist: '7 Tage', dosage: '0.2 L/ha (Kartoffel)', application_method: 'Spritzen',
    spe3_buffer: null, aktionsplan_status: 'Zugelassen',
  },
  {
    w_number: 'W-5678', product_name: 'Novodor FC', active_substance: 'Bacillus thuringiensis subsp. tenebrionis',
    product_type: 'Biologisches Insektizid', crops: 'Kartoffeln',
    target_organisms: 'Kartoffelkaefer (Larven)',
    auflagen: 'Bio-tauglich. Temperatur >15°C. UV-empfindlich — abends behandeln.', wartefrist: '0 Tage', dosage: '5 L/ha',
    application_method: 'Spritzen', spe3_buffer: null, aktionsplan_status: 'Zugelassen',
  },
  {
    w_number: 'W-6234', product_name: 'Madex TOP', active_substance: 'Cydia pomonella Granulovirus (CpGV)',
    product_type: 'Biologisches Insektizid', crops: 'Apfel, Birne, Walnuss',
    target_organisms: 'Apfelwickler',
    auflagen: 'Bio-tauglich. Spezifisch gegen Wickler.', wartefrist: '0 Tage', dosage: '0.1 L/ha',
    application_method: 'Spritzen', spe3_buffer: null, aktionsplan_status: 'Zugelassen',
  },
  {
    w_number: 'W-6712', product_name: 'Axial', active_substance: 'Pinoxaden',
    product_type: 'Herbizid (Graminizid)', crops: 'Weizen, Gerste, Triticale, Roggen',
    target_organisms: 'Ackerfuchsschwanz, Windhalm, Flughafer',
    auflagen: 'ACCase-Hemmer — Resistenzrisiko beachten. OELN-konform.', wartefrist: 'Nicht relevant', dosage: '0.45-0.9 L/ha',
    application_method: 'Spritzen', spe3_buffer: null, aktionsplan_status: 'Zugelassen',
  },
  {
    w_number: 'W-7101', product_name: 'Biathlon 4D', active_substance: 'Tritosulfuron + Florasulam',
    product_type: 'Herbizid (Breitband)', crops: 'Weizen, Gerste, Triticale, Roggen, Hafer',
    target_organisms: 'Klettenlabkraut, Kamille, Ehrenpreis, Knoeterich, diverse dikotyle Unkraeuter',
    auflagen: 'ALS-Hemmer — Resistenzrisiko. OELN-konform.', wartefrist: 'Nicht relevant', dosage: '70 g/ha',
    application_method: 'Spritzen', spe3_buffer: null, aktionsplan_status: 'Zugelassen',
  },
  {
    w_number: 'W-5901', product_name: 'Dual Gold', active_substance: 'S-Metolachlor',
    product_type: 'Herbizid (Bodenwirkung)', crops: 'Mais, Sonnenblumen, Soja',
    target_organisms: 'Hirse-Arten, Amarant, Gaensefuss',
    auflagen: 'Grundwasserschutz: nicht in Grundwasserschutzzonen S2. Metabolit-Monitoring.', wartefrist: 'Nicht relevant', dosage: '1.0-1.5 L/ha',
    application_method: 'Spritzen (Vorlauf)', spe3_buffer: '20m', aktionsplan_status: 'Zugelassen — unter Beobachtung (Metabolit)',
  },
  {
    w_number: 'W-5234', product_name: 'Lontrel 100', active_substance: 'Clopyralid',
    product_type: 'Herbizid (Wuchsstoff)', crops: 'Mais, Zuckerrueben, Erdbeeren',
    target_organisms: 'Ackerkratzdistel, Kamille, Gaensefuss',
    auflagen: 'Persistent in Kompost — Nachbaueinschraenkungen. OELN-konform.', wartefrist: 'Produktspezifisch', dosage: '0.5-1.0 L/ha',
    application_method: 'Spritzen', spe3_buffer: null, aktionsplan_status: 'Zugelassen',
  },
  {
    w_number: 'W-4200', product_name: 'Glyphosate (div. Produkte)', active_substance: 'Glyphosat',
    product_type: 'Herbizid (Total)', crops: 'Stoppel, Vorauflauf, Nichtkulturland',
    target_organisms: 'Alle Unkraeuter und Ungraeser (nicht-selektiv)',
    auflagen: 'Verbot auf versiegelten Flaechen und Gleisanlagen (seit 2020). Eingeschraenkte Anwendung im Ackerbau. OELN: nur Stoppelbehandlung und Direktsaat-Vorbereitung.',
    wartefrist: 'Vor Aussaat', dosage: '3-4 L/ha', application_method: 'Spritzen',
    spe3_buffer: '6m', aktionsplan_status: 'Zugelassen — politisch umstritten, Einschraenkungen laufend',
  },
  {
    w_number: 'W-KU-diverse', product_name: 'Kupferpraeparate (Funguran, Cuproxat, etc.)',
    active_substance: 'Kupferhydroxid / Kupferoxychlorid',
    product_type: 'Fungizid (anorganisch)', crops: 'Kartoffeln, Reben, Kernobst, Steinobst',
    target_organisms: 'Krautfaeule, Falscher Mehltau, Apfelschorf, Feuerbrand',
    auflagen: 'Max. 4 kg Reinkupfer/ha/Jahr (Bio Suisse). Bodenanreicherung beachten. SPe 3-Auflagen moeglich.', wartefrist: 'Produktspezifisch', dosage: 'Variabel nach Kultur und Produkt',
    application_method: 'Spritzen', spe3_buffer: '20m', aktionsplan_status: 'Zugelassen — Kupferreduktion ist Ziel des Aktionsplans PSM',
  },
  {
    w_number: 'W-SW-diverse', product_name: 'Netzschwefel (div. Produkte)',
    active_substance: 'Schwefel',
    product_type: 'Fungizid / Akarizid', crops: 'Reben, Kernobst, Steinobst, Beeren',
    target_organisms: 'Echter Mehltau (Oidium), Schorf, Spinnmilben',
    auflagen: 'Bio-tauglich. Nicht bei >25°C anwenden (Verbrennungsgefahr). Mischbarkeit pruefen.', wartefrist: 'Produktspezifisch', dosage: '4-8 kg/ha (Reben)',
    application_method: 'Spritzen', spe3_buffer: null, aktionsplan_status: 'Zugelassen',
  },
];

// ---------------------------------------------------------------------------
// 5. Insert data
// ---------------------------------------------------------------------------

const insertPest = db.instance.prepare(`
  INSERT OR REPLACE INTO pests (id, name, pest_type, scientific_name, crops_affected, crop_category, lifecycle, identification, damage_description, language, jurisdiction)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CH')
`);

const insertTreatment = db.instance.prepare(`
  INSERT INTO treatments (pest_id, approach, product_name, active_substance, w_number, dosage, waiting_period, timing, restrictions, pufferstreifen, notes, jurisdiction)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CH')
`);

const insertIpm = db.instance.prepare(`
  INSERT INTO ipm_guidance (crop, crop_category, pest_id, threshold, monitoring_method, cultural_controls, prognose_system, oeln_requirements, notes, jurisdiction)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CH')
`);

const insertProduct = db.instance.prepare(`
  INSERT OR REPLACE INTO approved_products (w_number, product_name, active_substance, product_type, crops, target_organisms, auflagen, wartefrist, dosage, application_method, spe3_buffer, aktionsplan_status, jurisdiction)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CH')
`);

const insertFts = db.instance.prepare(`
  INSERT INTO search_index (title, body, pest_type, crop_category, jurisdiction)
  VALUES (?, ?, ?, ?, 'CH')
`);

const insertAll = db.instance.transaction(() => {
  // Clear existing data
  db.instance.exec('DELETE FROM treatments');
  db.instance.exec('DELETE FROM ipm_guidance');
  db.instance.exec('DELETE FROM approved_products');
  db.instance.exec('DELETE FROM pests');
  db.instance.exec('DELETE FROM search_index');

  // Insert pests
  for (const p of pests) {
    insertPest.run(
      p.id, p.name, p.pest_type, p.scientific_name,
      JSON.stringify(p.crops_affected), p.crop_category,
      p.lifecycle, p.identification, p.damage_description, p.language
    );

    // FTS index entry for each pest
    const body = [p.identification, p.damage_description, p.lifecycle, p.scientific_name, p.crops_affected.join(', ')].join(' | ');
    insertFts.run(`${p.name} — ${p.pest_type}`, body, p.pest_type, p.crop_category);
  }

  // Insert treatments
  for (const t of treatments) {
    insertTreatment.run(
      t.pest_id, t.approach, t.product_name, t.active_substance,
      t.w_number, t.dosage, t.waiting_period, t.timing,
      t.restrictions, t.pufferstreifen, t.notes
    );

    // FTS index entry for treatments with products
    if (t.product_name) {
      const body = [t.product_name, t.active_substance, t.dosage, t.timing, t.restrictions, t.notes].filter(Boolean).join(' | ');
      insertFts.run(`Behandlung: ${t.product_name} gegen ${t.pest_id}`, body, 'treatment', 'feldbau');
    }
  }

  // Insert IPM guidance
  for (const g of ipmGuidance) {
    insertIpm.run(
      g.crop, g.crop_category, g.pest_id, g.threshold,
      g.monitoring_method, g.cultural_controls, g.prognose_system,
      g.oeln_requirements, g.notes
    );

    // FTS index entry for IPM
    const body = [g.threshold, g.monitoring_method, g.cultural_controls, g.prognose_system, g.oeln_requirements].filter(Boolean).join(' | ');
    insertFts.run(`IPM: ${g.crop} — ${g.pest_id}`, body, 'ipm', g.crop_category);
  }

  // Insert approved products
  for (const p of approvedProducts) {
    insertProduct.run(
      p.w_number, p.product_name, p.active_substance, p.product_type,
      p.crops, p.target_organisms, p.auflagen, p.wartefrist,
      p.dosage, p.application_method, p.spe3_buffer, p.aktionsplan_status
    );

    // FTS index entry
    const body = [p.active_substance, p.crops, p.target_organisms, p.auflagen, p.aktionsplan_status].join(' | ');
    insertFts.run(`PSM: ${p.product_name} (${p.w_number})`, body, 'product', 'alle');
  }

  // Update metadata
  db.run(`INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('last_ingest', ?)`, [now]);
  db.run(`INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('build_date', ?)`, [now]);
});

insertAll();

console.log(`Ingested:`);
console.log(`  ${pests.length} pests (insects: ${pests.filter(p => p.pest_type === 'insect').length}, diseases: ${pests.filter(p => p.pest_type === 'disease').length}, weeds: ${pests.filter(p => p.pest_type === 'weed').length})`);
console.log(`  ${treatments.length} treatments`);
console.log(`  ${ipmGuidance.length} IPM guidance entries`);
console.log(`  ${approvedProducts.length} approved products`);

// ---------------------------------------------------------------------------
// 6. Write coverage.json and sources.yml
// ---------------------------------------------------------------------------

const coverage = {
  server: 'ch-pest-management-mcp',
  jurisdiction: 'CH',
  version: '0.1.0',
  last_ingest: now,
  data: {
    pests: pests.length,
    pests_insects: pests.filter(p => p.pest_type === 'insect').length,
    pests_diseases: pests.filter(p => p.pest_type === 'disease').length,
    pests_weeds: pests.filter(p => p.pest_type === 'weed').length,
    treatments: treatments.length,
    ipm_guidance: ipmGuidance.length,
    approved_products: approvedProducts.length,
    prognosis_systems: ['PhytoPRE', 'SOPRA', 'FusaProg', 'VitiMeteo'],
    crop_categories: ['feldbau', 'rebbau', 'obstbau', 'gemuese'],
  },
  tools: 10,
  sources: [
    'BLW Pflanzenschutzmittelverzeichnis (psm.admin.ch)',
    'Agroscope Pflanzenschutzempfehlungen',
    'AGRIDEA OELN-Checklisten',
    'Aktionsplan Pflanzenschutzmittel',
  ],
};

writeFileSync('data/coverage.json', JSON.stringify(coverage, null, 2) + '\n');
console.log('Wrote data/coverage.json');

const sourcesYml = `# Data sources for ch-pest-management-mcp
sources:
  - name: BLW Pflanzenschutzmittelverzeichnis
    authority: Bundesamt fuer Landwirtschaft (BLW)
    url: https://www.psm.admin.ch/de/produkte
    license: Swiss Federal Administration — free reuse
    update_frequency: continuous (products added/removed)
    last_retrieved: "${now}"

  - name: Agroscope Pflanzenschutzempfehlungen
    authority: Agroscope
    url: https://www.agroscope.admin.ch/agroscope/de/home/themen/pflanzenbau/pflanzenschutz.html
    license: Swiss Federal Administration — free reuse
    update_frequency: annual
    last_retrieved: "${now}"

  - name: AGRIDEA OELN-Pflanzenschutz-Checklisten
    authority: AGRIDEA
    url: https://www.agridea.ch/de/themen/pflanzenbau/pflanzenschutz/
    license: Public advisory material
    update_frequency: annual
    last_retrieved: "${now}"

  - name: Aktionsplan Pflanzenschutzmittel
    authority: Bundesrat / BLW
    url: https://www.blw.admin.ch/blw/de/home/nachhaltige-produktion/pflanzenschutz/aktionsplan.html
    license: Swiss Federal Administration — free reuse
    update_frequency: periodic (adopted 2017, targets to 2027)
    last_retrieved: "${now}"

  - name: PhytoPRE Prognosemodell
    authority: Agroscope
    url: https://www.phytopre.ch
    license: Public access
    update_frequency: real-time (growing season)
    last_retrieved: "${now}"

  - name: SOPRA Schaedlingsprognose
    authority: Agroscope
    url: https://www.sopra.info
    license: Public access
    update_frequency: real-time (growing season)
    last_retrieved: "${now}"

  - name: FusaProg Fusariumprognose
    authority: Agroscope / Meteotest
    url: https://www.fusaprog.ch
    license: Public access
    update_frequency: real-time (growing season)
    last_retrieved: "${now}"

  - name: VitiMeteo Rebenprognose
    authority: Agroscope Changins
    url: https://www.vitimeteo.info
    license: Public access
    update_frequency: real-time (growing season)
    last_retrieved: "${now}"
`;

writeFileSync('data/sources.yml', sourcesYml);
console.log('Wrote data/sources.yml');

db.close();
console.log('Done.');
