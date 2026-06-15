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
      sources: ["eb-hundred-years", "eb-joan", "eb-nantes", "eb-louis-xiv"],
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
      sources: ["eb-revolution", "eb-rights-of-man", "eb-napoleon"],
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
      sources: ["eb-france", "eb-fifth-republic", "eb-de-gaulle"],
    },
  ],
  sources: [
    { id: "eb-france", label: "France", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/place/France", kind: "encyclopedia" },
    { id: "eb-marseille", label: "Marseille", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/place/Marseille", kind: "encyclopedia" },
    { id: "eb-alesia", label: "Battle of Alesia", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/event/Battle-of-Alesia", kind: "encyclopedia" },
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
    { id: "eb-de-gaulle", label: "Charles de Gaulle", publisher: "Encyclopædia Britannica", url: "https://www.britannica.com/biography/Charles-de-Gaulle", kind: "encyclopedia" },
  ],
  status: "published",
  updated: "2026-06-13",
};
