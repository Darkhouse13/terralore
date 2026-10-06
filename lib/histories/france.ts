import type { CountryHistory } from "../types";

export const france: CountryHistory = {
  code: "FRA",
  name: "France",
  tagline: "From the forests of Gaul to the Fifth Republic",
  summary:
    "France was not founded in a single moment but assembled over two thousand years — from Celtic Gaul and Roman province, through the Frankish realms that gave the country its name, the long consolidation of the Capetian kings, the Revolution that abolished the monarchy, and five republics punctuated by two empires. Few nations have rehearsed so many ideas of what a state can be.",
  founding: {
    label: "Treaty of Verdun",
    yearLabel: "843 CE",
    year: 843,
    detail:
      "The Treaty of Verdun split Charlemagne's empire among his grandsons; the western portion, West Francia, is the territorial and political ancestor of France. The realm was consolidated under Hugh Capet from 987.",
  },
  statehood: {
    formation: {
      year: 843,
      yearLabel: "10 August 843",
      label: "The Treaty of Verdun gives Charles the Bald West Francia",
      detail:
        "West Francia eventually became the Kingdom of France, and the corpus's founding claim and its statehood anchor are the same event. The German occupation of 1940–44 was a wartime occupation with sovereignty restored at the war's end and is not recorded as an interruption.",
      sources: ["wikipedia-verdun", "nwe-france"],
    },
  },
  quickFacts: [
    { label: "Name from", value: "the Franks (Latin Francia)" },
    { label: "Oldest cities", value: "Marseille, founded c. 600 BCE" },
    { label: "Capetian line begins", value: "987 CE (Hugh Capet)" },
    { label: "Monarchy abolished", value: "1792 (First Republic)" },
    { label: "Current constitution", value: "1958 (Fifth Republic)" },
  ],
  eras: [
    {
      id: "gaul",
      title: "Gaul & Rome",
      period: "c. 600 BCE – 486 CE",
      startYear: -600,
      endYear: 486,
      standfirst:
        "Before France there was Gaul — a patchwork of Celtic peoples drawn into the Mediterranean world, then conquered and Latinised by Rome.",
      body: [
        "Greek settlers from Phocaea founded Massalia — today's Marseille — around 600 BCE, planting a Mediterranean trading culture on the southern coast. Inland lay Gaul, home to dozens of Celtic tribes whose oppida, coinage and craft Rome would later both admire and subdue.",
        "Between 58 and 50 BCE, Julius Caesar conquered Gaul in a series of campaigns recorded in his own Commentarii de Bello Gallico. The decisive moment came at the siege of Alesia in 52 BCE, where the Arvernian chieftain Vercingetorix, having united much of Gaul in revolt, was finally starved into surrender.",
        "For the next five centuries Gaul was Roman. Cities such as Lugdunum (Lyon), Nemausus (Nîmes) and Arelate (Arles) acquired amphitheatres, aqueducts and Latin law; Christianity spread from the 2nd century. As the Western Empire weakened, Germanic peoples settled within its frontiers — among them the Franks, who would give the country its name.",
      ],
      events: [
        {
          year: -600,
          yearLabel: "c. 600 BCE",
          title: "Foundation of Massalia (Marseille)",
          summary:
            "Greek colonists from Phocaea establish a trading port — the oldest city in France.",
          category: "founding",
          sources: ["eb-marseille"],
        },
        {
          year: -52,
          yearLabel: "52 BCE",
          title: "Siege of Alesia",
          summary:
            "Caesar defeats Vercingetorix, completing the Roman conquest of Gaul.",
          category: "war",
          sources: ["eb-alesia", "eb-vercingetorix"],
        },
        {
          year: -50,
          yearLabel: "50 BCE",
          title: "Gaul becomes Roman",
          summary:
            "Gaul is incorporated into the Roman world; Latin, Roman law and cities reshape the land.",
          category: "politics",
          sources: ["eb-france"],
        },
      ],
      figures: [
        {
          name: "Vercingetorix",
          role: "Chieftain of the Arverni",
          life: "c. 82–46 BCE",
          blurb:
            "United Gallic tribes against Rome and became, much later, a national symbol of resistance.",
          sources: ["eb-vercingetorix"],
        },
      ],
      sources: ["eb-france", "eb-alesia", "eb-vercingetorix", "eb-marseille"],
    },
    {
      id: "franks",
      title: "The Franks & the Birth of France",
      period: "486 – 987 CE",
      startYear: 486,
      endYear: 987,
      standfirst:
        "A Germanic people, the Franks, built a Christian kingdom that grew into Charlemagne's empire — and on its division, France was born.",
      body: [
        "In 486 Clovis I, king of the Salian Franks, defeated the last Roman governor at Soissons and began uniting the Frankish tribes. His conversion to Catholic Christianity around 496–508 — rather than the Arianism of rival Germanic kings — bound the Frankish monarchy to the Church and to the Gallo-Roman population, a alliance that would shape European history.",
        "The Carolingian dynasty reached its height under Charlemagne, crowned Emperor of the Romans by Pope Leo III on Christmas Day, 800. His realm stretched across much of Western Europe, reviving learning and administration.",
        "It did not hold. The Treaty of Verdun in 843 divided the empire among Charlemagne's three grandsons. The western share, West Francia, is the direct ancestor of France. When the Carolingian line faltered, the nobles elected Hugh Capet king in 987, founding the Capetian dynasty that would rule, in its branches, for over 800 years.",
      ],
      events: [
        {
          year: 496,
          yearLabel: "c. 496–508",
          title: "Baptism of Clovis I",
          summary:
            "The first Frankish king to adopt Catholic Christianity, aligning crown and Church.",
          category: "religion",
          sources: ["eb-clovis"],
        },
        {
          year: 800,
          title: "Charlemagne crowned Emperor",
          summary:
            "Pope Leo III crowns Charlemagne in Rome, reviving the Western imperial title.",
          category: "politics",
          sources: ["eb-charlemagne"],
        },
        {
          year: 843,
          title: "Treaty of Verdun",
          summary:
            "Charlemagne's empire is split; West Francia becomes the seed of France.",
          category: "founding",
          sources: ["eb-verdun"],
        },
        {
          year: 911,
          yearLabel: "c. 911",
          title: "Rollo and the Viking grant of Normandy",
          summary:
            "Around 911 the West Frankish king Charles the Simple granted the Viking leader Rollo lands around Rouen in return for baptism and the defence of the Seine, the beginning of the duchy whose rulers conquered England in 1066.",
          category: "founding",
          sources: ["wiki-saint-clair"],
        },
        {
          year: 987,
          title: "Hugh Capet elected king",
          summary:
            "Beginning of the Capetian dynasty and the long consolidation of the French crown.",
          category: "founding",
          sources: ["eb-hugh-capet"],
        },
      ],
      figures: [
        {
          name: "Clovis I",
          role: "King of the Franks",
          life: "c. 466–511",
          blurb:
            "United the Franks and converted to Catholicism, founding the Merovingian kingdom.",
          sources: ["eb-clovis"],
        },
        {
          name: "Charlemagne",
          role: "King of the Franks, Emperor",
          life: "747–814",
          blurb:
            "Forged a Western European empire and a cultural revival; crowned emperor in 800.",
          sources: ["eb-charlemagne"],
        },
      ],
      pullquote: {
        text: "The Treaty of Verdun is conventionally taken as the starting point of both French and German history.",
        attribution: "Encyclopædia Britannica, “Treaty of Verdun”",
      },
      sources: ["eb-clovis", "eb-charlemagne", "eb-verdun", "eb-hugh-capet"],
    },
    {
      id: "kingdom",
      title: "The Medieval & Early-Modern Kingdom",
      period: "987 – 1789",
      startYear: 987,
      endYear: 1789,
      standfirst:
        "Eight centuries of Capetian and Bourbon kings turned a small royal domain around Paris into Europe's most powerful absolute monarchy.",
      body: [
        "The Capetians slowly extended royal authority outward from the Île-de-France. War with England defined the late Middle Ages: the Hundred Years' War (1337–1453) brought France close to dismemberment until Joan of Arc helped turn the tide at Orléans in 1429, before her capture and execution in 1431.",
        "The Renaissance and the Wars of Religion followed. In 1598 Henry IV issued the Edict of Nantes, granting France's Protestant Huguenots a measure of toleration and ending decades of civil war.",
        "Under Louis XIV — the 'Sun King', who reigned from 1643 to 1715 — royal absolutism reached its apogee at Versailles. But costly wars, fiscal crisis and Enlightenment ideas eroded the old order, setting the stage for revolution.",
      ],
      events: [
        {
          year: 1337,
          title: "Hundred Years' War begins",
          summary:
            "A dynastic struggle with England that would last until 1453 and forge French identity.",
          category: "war",
          sources: ["eb-hundred-years"],
        },
        {
          year: 1429,
          title: "Joan of Arc at Orléans",
          summary:
            "Joan lifts the siege of Orléans, reversing English fortunes; she is executed in 1431.",
          category: "war",
          sources: ["eb-joan"],
        },
        {
          year: 1598,
          title: "Edict of Nantes",
          summary:
            "Henry IV grants toleration to Protestants, ending the Wars of Religion.",
          category: "religion",
          sources: ["eb-nantes"],
        },
        {
          year: 1643,
          yearLabel: "1643–1715",
          title: "Reign of Louis XIV",
          summary:
            "Absolutism and the court of Versailles make France the dominant power in Europe.",
          category: "politics",
          sources: ["eb-louis-xiv"],
        },
        {
          year: 1643,
          title: "Cayenne settled",
          summary:
            "A Rouen company's expedition under Charles Poncet de Brétigny buys the hill at the mouth of the Cayenne river from a local leader, Cépérou, and builds a fort. Dutch and English forces take the town several times before France regains it for good in 1664.",
          category: "colonization",
          sources: ["outremers360-cayenne"],
        },
        {
          year: 1713,
          yearLabel: "11 April 1713",
          title: "Treaty of Utrecht names the “Japoc or Vincent Pinson”",
          summary:
            "Article 8 fixes the France–Portugal frontier in Guiana on a river of that name. Brazil later argued it was the Oyapock and France that it was the Araguari, a disagreement settled by arbitration in 1900.",
          category: "politics",
          sources: ["riaa-1900"],
        },
        {
          year: 1763,
          yearLabel: "1763–1765",
          title: "The Kourou expedition",
          summary:
            "After the Treaty of Paris, France sends thousands of settlers to the Kourou coast in French Guiana with little prepared for them. Disease kills a large share of them within about two years; sources differ on the totals.",
          category: "disaster",
          sources: ["acad-outremer-kourou", "mariners-kourou"],
        },
      ],
      figures: [
        {
          name: "Joan of Arc",
          role: "Military leader, saint",
          life: "c. 1412–1431",
          blurb:
            "A peasant girl whose visions and victories helped save the French crown; canonised in 1920.",
          sources: ["eb-joan"],
        },
        {
          name: "Louis XIV",
          role: "King of France",
          life: "1638–1715",
          blurb:
            "The 'Sun King', emblem of absolute monarchy and builder of Versailles.",
          sources: ["eb-louis-xiv"],
        },
      ],
      sources: ["eb-hundred-years", "eb-joan", "eb-nantes", "eb-louis-xiv", "outremers360-cayenne", "riaa-1900", "acad-outremer-kourou", "mariners-kourou"],
    },
    {
      id: "revolution",
      title: "Revolution & Empire",
      period: "1789 – 1870",
      startYear: 1789,
      endYear: 1870,
      standfirst:
        "The Revolution destroyed the monarchy and proclaimed the rights of man; from its turmoil rose Napoleon, and then a century of contested regimes.",
      body: [
        "On 14 July 1789 a Paris crowd stormed the Bastille, and within weeks the National Assembly adopted the Declaration of the Rights of Man and of the Citizen. The monarchy was abolished in 1792 and Louis XVI executed in 1793; the Republic then passed through the Terror and the Directory.",
        "Napoleon Bonaparte seized power in 1799 and crowned himself Emperor in 1804. His armies remade the map of Europe and spread the Napoleonic Code — a lasting legal legacy — before his final defeat at Waterloo in 1815.",
        "The 19th century lurched between systems: a restored monarchy, the revolutions of 1830 and 1848, the short-lived Second Republic, and the Second Empire of Napoleon III, which collapsed in the Franco-Prussian War of 1870.",
      ],
      events: [
        {
          year: 1789,
          yearLabel: "14 July 1789",
          title: "Storming of the Bastille",
          summary:
            "The opening act of the French Revolution; later France's national day.",
          category: "war",
          sources: ["eb-revolution"],
        },
        {
          year: 1789,
          yearLabel: "Aug 1789",
          title: "Declaration of the Rights of Man",
          summary:
            "Proclaims liberty, equality and popular sovereignty — a founding text of modern democracy.",
          category: "politics",
          sources: ["eb-rights-of-man"],
        },
        {
          year: 1804,
          title: "Napoleon crowned Emperor",
          summary:
            "Bonaparte founds the First Empire and exports the Napoleonic Code across Europe.",
          category: "politics",
          sources: ["eb-napoleon"],
        },
        {
          year: 1815,
          title: "Battle of Waterloo",
          summary:
            "Napoleon's final defeat ends the Empire and the Napoleonic Wars.",
          category: "war",
          sources: ["eb-napoleon"],
        },
        {
          year: 1852,
          yearLabel: "1852–1953",
          title: "Penal colonies in French Guiana",
          summary:
            "From 1852 France sends convicts to penal camps in French Guiana, including the Îles du Salut. A decree of 1938 ends transportation; the last return convoy leaves in 1953. The Archives nationales d’outre-mer database covers nearly 100,000 convicts sent to French Guiana or New Caledonia between 1852 and 1953.",
          category: "politics",
          sources: ["anom-bagnards", "guyane-transportation"],
        },
      ],
      figures: [
        {
          name: "Napoleon Bonaparte",
          role: "General, Emperor",
          life: "1769–1821",
          blurb:
            "Soldier-statesman whose conquests and legal code reshaped Europe; Emperor 1804–1814/15.",
          sources: ["eb-napoleon"],
        },
      ],
      pullquote: {
        text: "Men are born and remain free and equal in rights.",
        attribution: "Declaration of the Rights of Man and of the Citizen, 1789",
      },
      sources: ["eb-revolution", "eb-rights-of-man", "eb-napoleon", "anom-bagnards", "guyane-transportation"],
    },
    {
      id: "republic",
      title: "The Republics & the Modern Nation",
      period: "1870 – present",
      startYear: 1870,
      endYear: 2025,
      standfirst:
        "Through two world wars, decolonisation and European integration, France settled into a durable republican order — its Fifth, founded in 1958.",
      body: [
        "The Third Republic (1870–1940) entrenched republican institutions, secular public schooling and empire. The First World War (1914–1918) was fought largely on French soil and cost some 1.4 million French lives.",
        "Defeated and occupied by Nazi Germany in 1940, France was divided between occupation and the Vichy regime until the Liberation of Paris in August 1944. The Fourth Republic followed in 1946.",
        "Amid the crisis of the Algerian War, Charles de Gaulle returned to found the Fifth Republic in 1958, whose strong presidency endures today. France was a founding member of the European Communities (Treaty of Rome, 1957) and adopted the euro, in circulation from 2002.",
      ],
      events: [
        {
          year: 1891,
          yearLabel: "25 May 1891",
          title: "Russian arbitration on the Maroni frontier",
          summary:
            "Emperor Alexander III of Russia, as arbitrator, rules that the Awa is the border river between French Guiana and Suriname; land upstream of its confluence with the Tapanahoni goes to the Netherlands. The award does not settle every question on the Suriname frontier.",
          category: "politics",
          sources: ["riaa-1891"],
        },
        {
          year: 1895,
          yearLabel: "1895–1899",
          title: "Dreyfus held on Devil’s Island",
          summary:
            "Captain Alfred Dreyfus, convicted of treason in 1894, is transferred in April 1895 to Devil’s Island off French Guiana to serve his sentence. He leaves the island in 1899; the Court of Cassation declares him innocent in 1906.",
          category: "politics",
          sources: ["lehavre-dreyfus"],
        },
        {
          year: 1900,
          yearLabel: "1 December 1900",
          title: "Swiss arbitration fixes the Brazil–French Guiana border",
          summary:
            "The Swiss Federal Council rules at Bern that the “Japoc or Vincent Pinson” of the Treaty of Utrecht is the Oyapock, as Brazil had argued, not the Araguari as France had. The border follows the Oyapock and, inland, the Tumuc-Humac watershed.",
          category: "politics",
          sources: ["riaa-1900", "senat-brazil-border"],
        },
        {
          year: 1905,
          title: "Separation of Church and State",
          summary:
            "The 1905 law establishes laïcité — France's distinctive secularism.",
          category: "politics",
          sources: ["eb-france"],
        },
        {
          year: 1944,
          yearLabel: "Aug 1944",
          title: "Liberation of Paris",
          summary:
            "Allied and Free French forces liberate Paris after four years of occupation.",
          category: "war",
          sources: ["eb-france"],
        },
        {
          year: 1946,
          yearLabel: "19 March 1946",
          title: "French Guiana becomes a département",
          summary:
            "A law of 19 March 1946, championed by deputies including Aimé Césaire and French Guiana’s Gaston Monnerville, makes Martinique, Guadeloupe, Réunion and French Guiana départements of France.",
          category: "politics",
          sources: ["elysee-1946"],
        },
        {
          year: 1958,
          title: "Fifth Republic founded",
          summary:
            "De Gaulle's new constitution creates the strong presidency that governs France today.",
          category: "founding",
          sources: ["eb-fifth-republic"],
        },
        {
          year: 1957,
          title: "Founding member of the EEC",
          summary:
            "France signs the Treaty of Rome, beginning European integration.",
          category: "economy",
          sources: ["eb-france"],
        },
        {
          year: 1964,
          yearLabel: "1964–1968",
          title: "Guiana Space Centre",
          summary:
            "On 14 April 1964 Prime Minister Georges Pompidou announces French Guiana as the site of France’s new space centre, chosen from fourteen sites studied; a Véronique sounding rocket launched on 9 April 1968 makes it operational. The first Ariane flies from it in 1979.",
          category: "culture",
          sources: ["esa-csg50"],
        },
        {
          year: 2002,
          title: "The euro in French Guiana",
          summary:
            "French Guiana, a département of France, uses the euro; the Banque de France’s subsidiary IEDOM acts as its central-bank delegate in overseas territories whose currency is the euro.",
          category: "economy",
          sources: ["iedom"],
        },
        {
          year: 2009,
          yearLabel: "Article 349 TFEU",
          title: "French Guiana an EU outermost region",
          summary:
            "Article 349 of the Treaty on the Functioning of the European Union names French Guiana among the outermost regions, whose remoteness justifies specific measures in the application of EU law there. It is one of nine such regions.",
          category: "politics",
          sources: ["eur-lex-349", "eu-outermost"],
        },
        {
          year: 2017,
          title: "Oyapock bridge opens",
          summary:
            "The bridge across the Oyapock between Saint-Georges-de-l’Oyapock and Oiapoque, finished in 2011, opens in 2017. France and Brazil share a border of more than 730 km, which the Sénat describes as France’s longest land border.",
          category: "economy",
          sources: ["senat-brazil-border"],
        },
      ],
      figures: [
        {
          name: "Charles de Gaulle",
          role: "General, President",
          life: "1890–1970",
          blurb:
            "Led Free France in WWII and founded the Fifth Republic, dominating its first decade.",
          sources: ["eb-de-gaulle"],
        },
      ],
      sources: ["eb-france", "eb-fifth-republic", "eb-de-gaulle", "riaa-1891", "lehavre-dreyfus", "riaa-1900", "senat-brazil-border", "elysee-1946", "esa-csg50", "iedom", "eur-lex-349", "eu-outermost"],
    },
  ],
  sources: [
    { id: "eb-france", label: "France", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/place/France", kind: "encyclopedia" },
    { id: "eb-marseille", label: "Marseille", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/place/Marseille", kind: "encyclopedia" },
    { id: "eb-alesia", label: "Vercingetorix and Alesia", publisher: "Musée d’Archéologie nationale", url: "https://musee-archeologienationale.fr/en/node/1592", kind: "museum" },
    { id: "eb-vercingetorix", label: "Vercingetorix", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/biography/Vercingetorix", kind: "encyclopedia" },
    { id: "eb-clovis", label: "Clovis I", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/biography/Clovis-I", kind: "encyclopedia" },
    { id: "eb-charlemagne", label: "Charlemagne", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/biography/Charlemagne", kind: "encyclopedia" },
    { id: "eb-verdun", label: "Treaty of Verdun", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/event/Treaty-of-Verdun", kind: "encyclopedia" },
    { id: "eb-hugh-capet", label: "Hugh Capet", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/biography/Hugh-Capet", kind: "encyclopedia" },
    { id: "eb-hundred-years", label: "Hundred Years' War", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/event/Hundred-Years-War", kind: "encyclopedia" },
    { id: "eb-joan", label: "St. Joan of Arc", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/biography/Saint-Joan-of-Arc", kind: "encyclopedia" },
    { id: "eb-nantes", label: "Edict of Nantes", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/event/Edict-of-Nantes", kind: "encyclopedia" },
    { id: "eb-louis-xiv", label: "Louis XIV", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/biography/Louis-XIV-king-of-France", kind: "encyclopedia" },
    { id: "eb-revolution", label: "French Revolution", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/event/French-Revolution", kind: "encyclopedia" },
    { id: "eb-rights-of-man", label: "Declaration of the Rights of Man and of the Citizen", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/topic/Declaration-of-the-Rights-of-Man-and-of-the-Citizen", kind: "encyclopedia" },
    { id: "eb-napoleon", label: "Napoleon I", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/biography/Napoleon-I", kind: "encyclopedia" },
    { id: "eb-fifth-republic", label: "France — The Fifth Republic", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/place/France/The-Fifth-Republic", kind: "encyclopedia" },
    { id: "eb-de-gaulle", label: "Charles de Gaulle", publisher: "Presidency of the French Republic (Élysée)", url: "https://www.elysee.fr/en/charles-de-gaulle", kind: "gov" },
    { id: "outremers360-cayenne", label: "Histoire des chefs-lieux d’Outre-mer: Cayenne", publisher: "Outremers 360", url: "https://outremers360.com/bassin-atlantique-appli/serie-histoire-des-chefs-lieux-doutre-mer-cayenne-symbole-des-multiples-identites-guyanaises", kind: "reference" },
    { id: "acad-outremer-kourou", label: "Kourou, 1763: le dernier rêve de l’Amérique française (review)", publisher: "Académie des sciences d’outre-mer", url: "https://www.academieoutremer.fr/images/files/Kourou-1763-%2857_963%29%281%29.pdf", kind: "academic" },
    { id: "mariners-kourou", label: "Welcome to Kourou, Colony of Death", publisher: "The Mariners’ Museum", url: "https://www.marinersmuseum.org/2023/03/welcome-to-kourou-colony-of-death/", kind: "museum" },
    { id: "anom-bagnards", label: "Base des bagnards (Archives nationales d’outre-mer), announcement", publisher: "RFgenealogie", url: "https://www.rfgenealogie.com/infos/anom-une-nouvelle-version-de-la-base-des-bagnards", kind: "reference" },
    { id: "guyane-transportation", label: "Chronologie sommaire de la transportation", publisher: "Académie de la Guyane (Éducation nationale)", url: "https://hist-geographie.dis.ac-guyane.fr/IMG/pdf/chronologiesommaire_transportation.pdf", kind: "gov" },
    { id: "riaa-1891", label: "Award on the France/Netherlands boundary in Guiana, 25 May 1891", publisher: "United Nations, Reports of International Arbitral Awards vol. XXVIII", url: "https://legal.un.org/riaa/cases/vol_XXVIII/249-254.pdf", kind: "primary" },
    { id: "riaa-1900", label: "Arbitral award on the Brazil/French Guiana boundary, 1 December 1900", publisher: "United Nations, Reports of International Arbitral Awards vol. XXVIII", url: "https://legal.un.org/riaa/cases/vol_XXVIII/349-378.pdf", kind: "primary" },
    { id: "lehavre-dreyfus", label: "Chronologie indicative de l’Affaire Dreyfus (1894–1906)", publisher: "Archives municipales du Havre", url: "https://archives.lehavre.fr/sites/default/files/2022-03/chronologie%20affaire%20dreyfus_0.pdf", kind: "archive" },
    { id: "senat-brazil-border", label: "Coopération transfrontalière franco-brésilienne (rapport r22-846)", publisher: "Sénat", url: "https://www.senat.fr/rap/r22-846/r22-84621.html", kind: "gov" },
    { id: "elysee-1946", label: "80 ans de la loi du 19 mars 1946", publisher: "Présidence de la République (Élysée)", url: "https://www.elysee.fr/emmanuel-macron/2026/03/19/commemoration-des-80-ans-de-la-loi-du-19-mars-1946-tendant-au-classement-comme-departements-francais-de-la-guadeloupe-de-la-martinique-de-la-reunion-et-de-la-guyane-francaise-1", kind: "gov" },
    { id: "esa-csg50", label: "CSG at 50: half a century of Europe’s Spaceport", publisher: "European Space Agency", url: "https://www.esa.int/About_Us/50_years_of_ESA/CSG_at_50_half_a_century_of_Europe_s_Spaceport", kind: "gov" },
    { id: "iedom", label: "Institut d’émission des départements d’outre-mer", publisher: "IEDOM (Banque de France)", url: "https://www.iedom.fr/", kind: "gov" },
    { id: "eur-lex-349", label: "Treaty on the Functioning of the European Union, Article 349", publisher: "EUR-Lex", url: "https://eur-lex.europa.eu/eli/treaty/tfeu_2012/art_349/oj/eng", kind: "primary" },
    { id: "eu-outermost", label: "Outermost regions", publisher: "European Commission, Regional and Urban Policy", url: "https://regions-and-cities.ec.europa.eu/policy/themes/outermost-regions_en", kind: "gov" },
    { id: "wikipedia-verdun", label: "Treaty of Verdun", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Treaty_of_Verdun", kind: "reference" },
    { id: "wiki-saint-clair", label: "Treaty of Saint-Clair-sur-Epte", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Treaty_of_Saint-Clair-sur-Epte", kind: "reference" },
    { id: "nwe-france", label: "France", publisher: "New World Encyclopedia", url: "https://www.newworldencyclopedia.org/entry/France", kind: "encyclopedia" },
  ],
  status: "published",
  updated: "2026-08-22",
};
