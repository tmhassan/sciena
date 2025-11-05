import requests, csv, json, re, os, pandas as pd, time
from pathlib import Path
import urllib.request
from urllib.error import HTTPError
from io import StringIO
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DATA_DIR.mkdir(exist_ok=True)

class CompoundCollector:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        
    def get_iherb_supplements(self):
        """Scrape iHerb supplement categories - they have thousands"""
        try:
            supplements = []
            categories = [
                'vitamins', 'minerals', 'herbs', 'amino-acids', 'probiotics',
                'omega-fatty-acids', 'sports-nutrition', 'protein', 'superfoods'
            ]
            
            for category in categories:
                try:
                    url = f"https://www.iherb.com/c/{category}"
                    resp = self.session.get(url, timeout=10)
                    
                    if resp.status_code == 200:
                        from bs4 import BeautifulSoup
                        soup = BeautifulSoup(resp.text, 'html.parser')
                        
                        # Look for product titles
                        for elem in soup.find_all(['a', 'span', 'h3'], class_=re.compile(r'product|title|name')):
                            text = elem.get_text(strip=True)
                            if text and len(text) > 3 and len(text) < 100:
                                # Extract supplement name from product title
                                clean_name = re.sub(r'\d+.*mg|capsules?|tablets?|powder|liquid.*', '', text, flags=re.IGNORECASE)
                                clean_name = re.sub(r'\(.*?\)|,.*', '', clean_name).strip()
                                if clean_name and len(clean_name) > 3:
                                    supplements.append(clean_name)
                        
                        time.sleep(0.5)
                except Exception as e:
                    logger.warning(f"iHerb category {category} failed: {e}")
                    continue
            
            # Clean and deduplicate
            supplements = list(set([s for s in supplements if len(s) > 3 and len(s) < 50]))
            df = pd.DataFrame({'name': supplements, 'category': 'supplement'})
            print(f"✅ iHerb: {len(df)} supplements")
            return df
            
        except Exception as e:
            print(f"⚠️  iHerb failed: {e}")
            return pd.DataFrame(columns=["name", "category"])
    
    def get_vitacost_supplements(self):
        """Scrape Vitacost supplement database"""
        try:
            supplements = []
            categories = ['vitamins', 'minerals', 'herbs-botanicals', 'amino-acids', 'specialty-supplements']
            
            for category in categories:
                try:
                    url = f"https://www.vitacost.com/shop/vitamins-supplements/{category}"
                    resp = self.session.get(url, timeout=10)
                    
                    if resp.status_code == 200:
                        # Use regex to extract product names
                        product_patterns = [
                            r'"productName":"([^"]+)"',
                            r'title="([^"]*(?:vitamin|mineral|extract|acid|powder|capsule)[^"]*)"',
                            r'alt="([^"]*(?:supplement|nutrition|health)[^"]*)"'
                        ]
                        
                        for pattern in product_patterns:
                            matches = re.findall(pattern, resp.text, re.IGNORECASE)
                            for match in matches:
                                clean_name = re.sub(r'\d+.*mg|capsules?|tablets?', '', match, flags=re.IGNORECASE)
                                clean_name = re.sub(r'\(.*?\)', '', clean_name).strip()
                                if clean_name and len(clean_name) > 3:
                                    supplements.append(clean_name)
                        
                        time.sleep(0.5)
                except Exception as e:
                    continue
            
            supplements = list(set(supplements))
            df = pd.DataFrame({'name': supplements, 'category': 'supplement'})
            print(f"✅ Vitacost: {len(df)} supplements")
            return df
            
        except Exception as e:
            print(f"⚠️  Vitacost failed: {e}")
            return pd.DataFrame(columns=["name", "category"])
    
    def get_labdoor_supplements(self):
        """Get supplements from Labdoor rankings"""
        try:
            supplements = []
            categories = ['protein', 'creatine', 'multivitamins', 'fish-oil', 'bcaa', 'pre-workout']
            
            for category in categories:
                try:
                    url = f"https://labdoor.com/rankings/{category}"
                    resp = self.session.get(url, timeout=10)
                    
                    if resp.status_code == 200:
                        from bs4 import BeautifulSoup
                        soup = BeautifulSoup(resp.text, 'html.parser')
                        
                        # Extract product names
                        for elem in soup.find_all(['h2', 'h3', 'span'], class_=re.compile(r'product|brand|name')):
                            text = elem.get_text(strip=True)
                            if text and 3 < len(text) < 50:
                                supplements.append(text)
                        
                        time.sleep(0.5)
                except Exception as e:
                    continue
            
            supplements = list(set(supplements))
            df = pd.DataFrame({'name': supplements, 'category': 'supplement'})
            print(f"✅ Labdoor: {len(df)} supplements")
            return df
            
        except Exception as e:
            print(f"⚠️  Labdoor failed: {e}")
            return pd.DataFrame(columns=["name", "category"])
    
    def get_bodybuilding_supplements(self):
        """Get supplements from Bodybuilding.com"""
        try:
            url = "https://www.bodybuilding.com/store/supplements"
            resp = self.session.get(url, timeout=10)
            
            supplements = []
            if resp.status_code == 200:
                # Extract supplement names using regex
                patterns = [
                    r'"name":"([^"]+)"',
                    r'data-name="([^"]+)"',
                    r'title="([^"]*(?:protein|creatine|bcaa|vitamin|amino|pre.*workout)[^"]*)"'
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, resp.text, re.IGNORECASE)
                    for match in matches:
                        clean_name = re.sub(r'\d+.*(?:mg|g|lb|oz)', '', match, flags=re.IGNORECASE)
                        clean_name = re.sub(r'\(.*?\)', '', clean_name).strip()
                        if clean_name and 3 < len(clean_name) < 50:
                            supplements.append(clean_name)
            
            supplements = list(set(supplements))
            df = pd.DataFrame({'name': supplements, 'category': 'supplement'})
            print(f"✅ Bodybuilding.com: {len(df)} supplements")
            return df
            
        except Exception as e:
            print(f"⚠️  Bodybuilding.com failed: {e}")
            return pd.DataFrame(columns=["name", "category"])
    
    def get_pubchem_compounds(self):
        """Get compounds from PubChem database"""
        try:
            compounds = []
            
            # Search for supplement-related compounds
            search_terms = [
                'dietary supplement', 'vitamin', 'mineral', 'amino acid', 
                'protein', 'peptide', 'nootropic', 'adaptogen'
            ]
            
            for term in search_terms:
                try:
                    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{term}/property/MolecularFormula,MolecularWeight/JSON"
                    resp = self.session.get(url, timeout=10)
                    
                    if resp.status_code == 200:
                        data = resp.json()
                        if 'PropertyTable' in data and 'Properties' in data['PropertyTable']:
                            for prop in data['PropertyTable']['Properties'][:20]:  # Limit results
                                if 'CID' in prop:
                                    cid = prop['CID']
                                    # Get compound name
                                    name_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/property/Title/JSON"
                                    name_resp = self.session.get(name_url, timeout=5)
                                    if name_resp.status_code == 200:
                                        name_data = name_resp.json()
                                        if 'PropertyTable' in name_data:
                                            title = name_data['PropertyTable']['Properties'][0].get('Title', '')
                                            if title and len(title) > 3:
                                                compounds.append(title)
                    
                    time.sleep(0.5)
                except Exception as e:
                    continue
            
            compounds = list(set(compounds))
            df = pd.DataFrame({'name': compounds, 'category': 'supplement'})
            print(f"✅ PubChem: {len(df)} compounds")
            return df
            
        except Exception as e:
            print(f"⚠️  PubChem failed: {e}")
            return pd.DataFrame(columns=["name", "category"])
    
    def get_reddit_compounds(self):
        """Get popular compounds mentioned in relevant subreddits"""
        try:
            # Common compounds frequently discussed on Reddit
            reddit_compounds = {
                'nootropic': [
                    'Modafinil', 'Armodafinil', 'Piracetam', 'Oxiracetam', 'Aniracetam',
                    'Noopept', 'Alpha-GPC', 'CDP-Choline', 'Bacopa Monnieri', 'Lions Mane',
                    'Rhodiola Rosea', 'Ashwagandha', 'Phenylpiracetam', 'Adrafinil',
                    'L-Theanine', 'Caffeine', 'Tianeptine', 'Memantine', 'Bromantane',
                    'Phenibut', 'Picamilon', 'PRL-8-53', 'NSI-189', 'Semax', 'Selank',
                    'Dihexa', 'J147', 'RGPU-95', 'Emoxypine', 'Mexidol', 'P21',
                    'Sunifiram', 'Unifiram', 'Coluracetam', 'Fasoracetam', 'Nefiracetam'
                ],
                'sarm': [
                    'Ostarine', 'MK-2866', 'Ligandrol', 'LGD-4033', 'Testolone', 'RAD-140',
                    'Andarine', 'S4', 'Cardarine', 'GW-501516', 'Stenabolic', 'SR9009',
                    'Ibutamoren', 'MK-677', 'YK-11', 'S-23', 'ACP-105', 'RAD-150',
                    'LGD-3303', 'AC-262536', 'GSK-2881078', 'LY2452473', 'OPK-88004',
                    'GLPG0492', 'BMS-564929', 'JNJ-28330835', 'PF-06260414', 'S-40503'
                ],
                'peptide': [
                    'BPC-157', 'TB-500', 'Thymosin Beta-4', 'CJC-1295', 'Ipamorelin',
                    'GHRP-6', 'GHRP-2', 'Hexarelin', 'Sermorelin', 'Tesamorelin',
                    'PT-141', 'Bremelanotide', 'Melanotan II', 'MGF', 'PEG-MGF',
                    'Follistatin', 'AOD-9604', 'Fragment 176-191', 'Epitalon', 'GHK-Cu',
                    'ACE-031', 'Myostatin Inhibitor', 'DSIP', 'Selank', 'Semax',
                    'LL-37', 'Thymulin', 'KPV', 'Alpha-MSH', 'SNAP-8', 'Matrixyl'
                ]
            }
            
            all_compounds = []
            for category, compounds in reddit_compounds.items():
                for compound in compounds:
                    all_compounds.append({'name': compound, 'category': category})
            
            df = pd.DataFrame(all_compounds).drop_duplicates(subset=['name'])
            print(f"✅ Reddit Popular: {len(df)} compounds")
            return df
            
        except Exception as e:
            print(f"⚠️  Reddit compounds failed: {e}")
            return pd.DataFrame(columns=["name", "category"])
    
    def get_fda_supplement_database(self):
        """Get compounds from FDA supplement databases"""
        try:
            # FDA dietary supplement ingredients
            fda_supplements = [
                # Vitamins
                'Vitamin A', 'Vitamin B1', 'Thiamine', 'Vitamin B2', 'Riboflavin',
                'Vitamin B3', 'Niacin', 'Vitamin B5', 'Pantothenic Acid', 'Vitamin B6',
                'Pyridoxine', 'Vitamin B7', 'Biotin', 'Vitamin B9', 'Folate', 'Folic Acid',
                'Vitamin B12', 'Cobalamin', 'Vitamin C', 'Ascorbic Acid', 'Vitamin D',
                'Vitamin D2', 'Vitamin D3', 'Cholecalciferol', 'Vitamin E', 'Tocopherol',
                'Vitamin K', 'Vitamin K1', 'Vitamin K2', 'Phylloquinone', 'Menaquinone',
                
                # Minerals
                'Calcium', 'Iron', 'Magnesium', 'Zinc', 'Selenium', 'Copper', 'Manganese',
                'Chromium', 'Molybdenum', 'Iodine', 'Potassium', 'Phosphorus', 'Sulfur',
                'Chloride', 'Sodium', 'Fluoride', 'Cobalt', 'Nickel', 'Silicon', 'Tin',
                'Vanadium', 'Boron', 'Strontium', 'Rubidium', 'Lithium',
                
                # Amino Acids
                'Alanine', 'Arginine', 'Asparagine', 'Aspartic Acid', 'Cysteine',
                'Glutamic Acid', 'Glutamine', 'Glycine', 'Histidine', 'Isoleucine',
                'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Proline',
                'Serine', 'Threonine', 'Tryptophan', 'Tyrosine', 'Valine',
                'Carnitine', 'Taurine', 'Beta-Alanine', 'Citrulline', 'Ornithine',
                
                # Fatty Acids
                'Omega-3', 'EPA', 'DHA', 'ALA', 'Omega-6', 'GLA', 'Arachidonic Acid',
                'Oleic Acid', 'Linoleic Acid', 'Palmitic Acid', 'Stearic Acid',
                'CLA', 'Conjugated Linoleic Acid', 'MCT Oil', 'Caprylic Acid',
                'Capric Acid', 'Lauric Acid', 'Myristic Acid',
                
                # Herbal Extracts
                'Echinacea', 'Ginkgo Biloba', 'Ginseng', 'Garlic', 'Saw Palmetto',
                'St Johns Wort', 'Valerian', 'Kava', 'Milk Thistle', 'Turmeric',
                'Ginger', 'Green Tea', 'Grape Seed Extract', 'Bilberry',
                'Cranberry', 'Elderberry', 'Hawthorn', 'Chamomile', 'Passionflower'
            ]
            
            df = pd.DataFrame({'name': fda_supplements, 'category': 'supplement'})
            print(f"✅ FDA Database: {len(df)} supplements")
            return df
            
        except Exception as e:
            print(f"⚠️  FDA database failed: {e}")
            return pd.DataFrame(columns=["name", "category"])

def get_comprehensive_manual_lists():
    """Most comprehensive manual lists based on research and databases"""
    
    # MASSIVE supplement list from multiple databases
    supplements = [
        # Proteins & Muscle Building
        'Whey Protein', 'Casein Protein', 'Egg Protein', 'Soy Protein', 'Pea Protein',
        'Rice Protein', 'Hemp Protein', 'Collagen Protein', 'Bone Broth Protein',
        'Creatine Monohydrate', 'Creatine HCL', 'Creatine Ethyl Ester', 'Kre-Alkalyn',
        'Beta-Alanine', 'HMB', 'Leucine', 'Isoleucine', 'Valine', 'BCAA',
        'Citrulline Malate', 'L-Arginine', 'Agmatine Sulfate', 'Nitric Oxide Boosters',
        
        # Pre/Post Workout
        'Caffeine Anhydrous', 'Green Coffee Bean', 'Guarana', 'Yerba Mate',
        'Theacrine', 'Dynamine', 'PEA', 'Hordenine', 'Synephrine', 'Yohimbine HCL',
        'Rauwolscine', 'DMHA', 'DMAA', 'Eria Jarensis', 'Kanna', 'Kigelia Africana',
        
        # Vitamins (All Forms)
        'Vitamin A Palmitate', 'Vitamin A Acetate', 'Beta Carotene', 'Retinol',
        'Thiamine Mononitrate', 'Thiamine HCL', 'Riboflavin 5-Phosphate',
        'Niacinamide', 'Nicotinic Acid', 'Inositol Hexanicotinate',
        'Calcium Pantothenate', 'Pantethine', 'Pyridoxine HCL', 'Pyridoxal 5-Phosphate',
        'Methylfolate', '5-MTHF', 'Folinic Acid', 'Methylcobalamin', 'Adenosylcobalamin',
        'Hydroxycobalamin', 'Cyanocobalamin', 'Sodium Ascorbate', 'Calcium Ascorbate',
        'Magnesium Ascorbate', 'Ascorbyl Palmitate', 'Liposomal Vitamin C',
        'Ergocalciferol', 'Cholecalciferol', 'Calcidiol', 'Mixed Tocopherols',
        'Alpha Tocopherol', 'Gamma Tocopherol', 'Tocotrienols', 'Phytonadione',
        
        # Minerals (All Forms)
        'Calcium Carbonate', 'Calcium Citrate', 'Calcium Malate', 'Calcium Glycinate',
        'Magnesium Oxide', 'Magnesium Citrate', 'Magnesium Glycinate', 'Magnesium Malate',
        'Magnesium Threonate', 'Magnesium Taurate', 'Zinc Picolinate', 'Zinc Bisglycinate',
        'Zinc Citrate', 'Zinc Gluconate', 'Iron Bisglycinate', 'Iron Fumarate',
        'Iron Sulfate', 'Heme Iron', 'Ferrous Gluconate', 'Selenomethionine',
        'Sodium Selenite', 'Copper Gluconate', 'Copper Bisglycinate',
        'Manganese Bisglycinate', 'Chromium Picolinate', 'Chromium Polynicotinate',
        'Potassium Iodide', 'Kelp', 'Sodium Molybdate', 'Potassium Citrate',
        
        # Adaptogens & Herbs
        'Ashwagandha KSM-66', 'Rhodiola Rosea', 'Panax Ginseng', 'American Ginseng',
        'Siberian Ginseng', 'Schisandra Berry', 'Holy Basil', 'Tulsi', 'Cordyceps',
        'Reishi Mushroom', 'Lions Mane Mushroom', 'Chaga Mushroom', 'Turkey Tail',
        'Shiitake', 'Maitake', 'Oyster Mushroom', 'Agaricus Blazei',
        'Bacopa Monnieri', 'Ginkgo Biloba', 'Gotu Kola', 'Brahmi',
        'Mucuna Pruriens', 'Tongkat Ali', 'Tribulus Terrestris', 'Fenugreek',
        'Maca Root', 'Black Maca', 'Red Maca', 'Yellow Maca',
        
        # Antioxidants
        'Resveratrol', 'Pterostilbene', 'Quercetin', 'Rutin', 'Hesperidin',
        'Curcumin', 'Piperine', 'Boswellia', 'Green Tea Extract', 'EGCG',
        'Grape Seed Extract', 'Pine Bark Extract', 'Pycnogenol', 'Astaxanthin',
        'Lycopene', 'Lutein', 'Zeaxanthin', 'Anthocyanins', 'Proanthocyanidins',
        
        # Digestive Health
        'Probiotics', 'Lactobacillus Acidophilus', 'Bifidobacterium', 'Saccharomyces Boulardii',
        'Digestive Enzymes', 'Betaine HCL', 'Pepsin', 'Bromelain', 'Papain',
        'Amylase', 'Lipase', 'Protease', 'Cellulase', 'Lactase',
        'Psyllium Husk', 'Methylcellulose', 'Inulin', 'FOS', 'GOS',
        'L-Glutamine', 'Zinc Carnosine', 'DGL Licorice', 'Slippery Elm',
        
        # Sleep & Relaxation
        'Melatonin', 'Immediate Release Melatonin', 'Time Release Melatonin',
        'GABA', 'L-Theanine', 'Glycine', 'Taurine', 'Magnesium Bisglycinate',
        'Valerian Root', 'Passionflower', 'Chamomile', 'Lemon Balm', 'Skullcap',
        'Hops', 'Lavender', 'California Poppy', 'Jujube', 'Magnolia Bark',
        
        # Cognitive & Brain Health
        'Phosphatidylserine', 'Phosphatidylcholine', 'Alpha-GPC', 'CDP-Choline',
        'Centrophenoxine', 'DMAE', 'Huperzine A', 'Vinpocetine', 'PQQ',
        'Nicotinamide Riboside', 'NAD+', 'NMN', 'Spermidine', 'Fisetin',
        
        # Specialty Compounds
        'Berberine', 'Metformin', 'Diindolylmethane', 'DIM', 'Indole-3-Carbinol',
        'Sulforaphane', 'Broccoli Seed Extract', 'Spirulina', 'Chlorella',
        'Marine Collagen', 'Bovine Collagen', 'Chicken Collagen', 'Hyaluronic Acid',
        'Glucosamine', 'Chondroitin', 'MSM', 'UC-II Collagen', 'Boron',
        'Silica', 'Bamboo Extract', 'Horsetail Extract'
    ]
    
    # Research-grade SARMs
    sarms = [
        'Ostarine', 'MK-2866', 'Enobosarm', 'GTx-024',
        'Ligandrol', 'LGD-4033', 'VK5211', 'LGD-2226', 'LGD-3303',
        'Testolone', 'RAD-140', 'RAD-150', 'TLB-150',
        'Andarine', 'S-4', 'S-40503', 'S-23', 'S-40542',
        'Cardarine', 'GW-501516', 'GW-0742', 'GW-1516',
        'Stenabolic', 'SR9009', 'SR9011', 'REV-ERB Agonist',
        'Ibutamoren', 'MK-677', 'Nutrobal', 'L-163191',
        'YK-11', 'Myostatin Inhibitor',
        'ACP-105', 'AC-262536', 'GSK-2881078', 'LY2452473',
        'OPK-88004', 'GLPG0492', 'BMS-564929', 'JNJ-28330835',
        'PF-06260414', 'TFM-4AS-1', 'Selective Androgen Receptor Modulator'
    ]
    
    # Comprehensive peptides
    peptides = [
        # Growth Hormone Peptides
        'Growth Hormone Releasing Peptide-6', 'GHRP-6', 'His-D-Trp-Ala-Trp-D-Phe-Lys-NH2',
        'Growth Hormone Releasing Peptide-2', 'GHRP-2', 'D-Ala-D-2-Nal-Ala-Trp-D-Phe-Lys-NH2',
        'Hexarelin', 'Examorelin', 'His-D-2-methyl-Trp-Ala-Trp-D-Phe-Lys-NH2',
        'Ipamorelin', 'NNC 26-0161', 'Aib-His-D-2-Nal-D-Phe-Lys-NH2',
        'Sermorelin', 'GRF 1-29', 'GHRH 1-29', 'Growth Hormone Releasing Hormone',
        'CJC-1295', 'DAC:GRF', 'Drug Affinity Complex', 'Modified GRF 1-29',
        'Tesamorelin', 'Egrifta', 'TH9507', 'Growth Hormone Releasing Factor',
        
        # Healing & Recovery Peptides
        'BPC-157', 'Body Protection Compound', 'Pentadecapeptide BPC 157',
        'TB-500', 'Thymosin Beta-4', 'Tβ4', 'Ac-SDKP-NH2',
        'KPV', 'Lysine-Proline-Valine', 'Alpha-MSH Fragment',
        'LL-37', 'Cathelicidin', 'hCAP18', 'Antimicrobial Peptide',
        
        # Cosmetic Peptides
        'GHK-Cu', 'Copper Peptide', 'Gly-His-Lys-Cu',
        'Matrixyl', 'Palmitoyl Pentapeptide-4', 'Pal-KTTKS',
        'Argireline', 'Acetyl Hexapeptide-8', 'Acetyl Hexapeptide-3',
        'Syn-Ake', 'Dipeptide Diaminobutyroyl Benzylamide Diacetate',
        'SNAP-8', 'Acetyl Octapeptide-3', 'Anti-wrinkle Peptide',
        'Leuphasyl', 'Pentapeptide-18', 'Pentapeptide-3',
        
        # Performance Peptides
        'PT-141', 'Bremelanotide', 'Melanocortin Receptor Agonist',
        'Melanotan II', 'MT-II', 'Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-NH2',
        'MGF', 'Mechano Growth Factor', 'IGF-1Ec',
        'PEG-MGF', 'Pegylated Mechano Growth Factor',
        'Follistatin', 'FST', 'Activin-binding Protein',
        'ACE-031', 'Myostatin Inhibitor', 'ACVR2B',
        'AOD-9604', 'Anti-Obesity Drug', 'hGH Fragment 176-191',
        
        # Nootropic Peptides
        'Noopept', 'GVS-111', 'N-phenylacetyl-L-prolylglycine ethyl ester',
        'Semax', 'MEHFPGP', 'Met-Glu-His-Phe-Pro-Gly-Pro',
        'Selank', 'Thr-Lys-Pro-Arg-Pro-Gly-Pro',
        'P21', 'Cycloprolylglycine', 'Cognitive Enhancement Peptide',
        'Dihexa', 'N-hexanoic-Tyr-Ile-(6) aminohexanoic amide',
        'NSI-189', 'Neurogenic Compound', 'Hippocampal Neurogenesis',
        
        # Anti-aging Peptides
        'Epitalon', 'Epithalon', 'Alanyl-glutamyl-aspartyl-glycine',
        'Thymulin', 'Facteur Thymique Serique', 'FTS-Zn',
        'DSIP', 'Delta Sleep-inducing Peptide', 'Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu',
        'Alpha-MSH', 'Melanocyte Stimulating Hormone', 'Ac-Ser-Tyr-Ser-Met-Glu-His-Phe-Arg-Trp-Gly-Lys-Pro-Val-NH2'
    ]
    
    # Advanced nootropics
    nootropics = [
        # Racetams
        'Piracetam', '2-oxo-1-pyrrolidine acetamide', 'Nootropil',
        'Oxiracetam', '4-hydroxy-2-oxopyrrolidine-N-acetamide', 'Neuractiv',
        'Aniracetam', '1-(4-methoxybenzoyl)-2-pyrrolidinone', 'Draganon',
        'Pramiracetam', 'N-[2-(diisopropylamino)ethyl]-2-oxo-1-pyrrolidineacetamide',
        'Phenylpiracetam', 'Carphedon', '4-phenyl-2-oxopyrrolidine-1-acetamide',
        'Coluracetam', 'BCI-540', 'N-(2,3-dimethyl-5,6,7,8-tetrahydrofuro[2,3-b]quinolin-4-yl)-2-(2-oxopyrrolidin-1-yl)acetamide',
        'Fasoracetam', 'NS-105', '5-oxo-D-prolinepiperidinamide monohydrate',
        'Nefiracetam', 'DM-9384', 'N-(2,6-dimethylphenyl)-2-(2-oxo-1-pyrrolidinyl)acetamide',
        
        # Ampakines
        'Sunifiram', 'DM-235', '1-benzoyl-4-propanoylpiperazine',
        'Unifiram', 'DM-232', 'N-[(4S)-6-(4-fluorophenyl)-2,3-dihydroimidazo[1,2-a]pyrazin-7-yl]-N-methylacetamide',
        'CX-516', 'Ampalex', 'AMPA Receptor Positive Allosteric Modulator',
        'CX-546', 'BDP-12', 'Farampator',
        
        # Modafinil Family
        'Modafinil', 'Provigil', '2-[(diphenylmethyl)sulfinyl]acetamide',
        'Armodafinil', 'Nuvigil', 'R-Modafinil',
        'Adrafinil', 'Olmifon', '2-benzhydrylsulfinyl-N-hydroxyacetamide',
        'Flmodafinil', 'CRL-40,940', 'bisfluoromodafinil',
        'Hydrafinil', '9-Fluorenol', 'Fluorenol',
        
        # Cholinergics
        'Alpha-GPC', 'Choline Alfoscerate', 'L-Alpha glycerylphosphorylcholine',
        'CDP-Choline', 'Citicoline', 'Cytidine 5-diphosphocholine',
        'Centrophenoxine', 'Lucidril', 'DMAE p-Chlorophenoxyacetate',
        'DMAE', 'Dimethylaminoethanol', '2-(Dimethylamino)ethanol',
        'Huperzine A', 'Selagine', 'Huperzia serrata extract',
        'Galantamine', 'Reminyl', 'Razadyne',
        
        # Natural Nootropics
        'Bacopa Monnieri', 'Brahmi', 'Water Hyssop',
        'Lions Mane', 'Hericium erinaceus', 'Bearded Tooth Mushroom',
        'Rhodiola Rosea', 'Golden Root', 'Arctic Root',
        'Panax Ginseng', 'Asian Ginseng', 'Korean Ginseng',
        'Ginkgo Biloba', 'Maidenhair Tree', 'EGb 761',
        'Phosphatidylserine', 'PS', 'Serine Phospholipid',
        'Curcumin', 'Diferuloylmethane', 'Turmeric Extract',
        
        # Research Compounds
        'PRL-8-53', 'Phenyl-piracetam hydrazide', 'Memory Enhancement Drug',
        'NSI-189', 'Neurogenic Compound', 'Depression Treatment',
        '9-Me-BC', '9-methyl-β-carboline', 'Dopamine Enhancement',
        'IDRA-21', '7-chloro-3-methyl-3,4-dihydro-2H-1,2,4-benzothiadiazine S,S-dioxide',
        'Tianeptine', 'Coaxil', 'Atypical Antidepressant',
        'Memantine', 'Namenda', 'NMDA Receptor Antagonist',
        'Bromantane', 'Ladasten', 'Psychostimulant',
        'Phenibut', 'β-phenyl-GABA', '4-amino-3-phenylbutyric acid',
        'Picamilon', 'Pikamilon', 'Nicotinoyl-GABA',
        
        # Advanced Research Compounds
        'J147', 'Curcumin Derivative', 'Neuroprotective Compound',
        'RGPU-95', 'Russian Nootropic', 'Phenylpiracetam Derivative',
        'Compound 21', 'C21', 'Angiotensin Receptor Modulator',
        'VU0357017', 'Positive Allosteric Modulator', 'Cognitive Enhancer',
        'Dihexa', 'N-hexanoic-Tyr-Ile-(6) aminohexanoic amide', 'BDNF Enhancer'
    ]
    
    # Combine all categories
    all_compounds = []
    
    categories = [
        (supplements, 'supplement'),
        (sarms, 'sarm'),
        (peptides, 'peptide'),
        (nootropics, 'nootropic')
    ]
    
    for compound_list, category in categories:
        for compound in compound_list:
            all_compounds.append({'name': compound, 'category': category})
    
    df = pd.DataFrame(all_compounds).drop_duplicates(subset=['name'])
    return df

def build_ultimate_master():
    """Build the ultimate master compound list"""
    print("🚀 Building ULTIMATE master compound list...")
    print("=" * 60)
    
    collector = CompoundCollector()
    
    # All sources
    sources = [
        ("Comprehensive Manual Database", get_comprehensive_manual_lists),
        ("iHerb Supplements", collector.get_iherb_supplements),
        ("Vitacost Database", collector.get_vitacost_supplements),
        ("Labdoor Rankings", collector.get_labdoor_supplements),
        ("Bodybuilding.com", collector.get_bodybuilding_supplements),
        ("PubChem Database", collector.get_pubchem_compounds),
        ("Reddit Popular Compounds", collector.get_reddit_compounds),
        ("FDA Supplement Database", collector.get_fda_supplement_database),
    ]
    
    all_dfs = []
    
    for name, func in sources:
        try:
            print(f"\n📊 Processing: {name}")
            df = func()
            if not df.empty:
                all_dfs.append(df)
                print(f"   ✅ Success: {len(df)} compounds")
            else:
                print(f"   ⚠️  No data returned")
            time.sleep(1)
        except Exception as e:
            print(f"   ❌ Failed: {str(e)}")
            continue
    
    if not all_dfs:
        print("\n❌ ALL SOURCES FAILED!")
        return
    
    # Combine all data
    print(f"\n🔄 Combining data from {len(all_dfs)} successful sources...")
    combined = pd.concat(all_dfs, ignore_index=True)
    
    # Enhanced cleaning section
    print("🧹 Cleaning and deduplicating...")
    original_count = len(combined)

    # Clean names
    combined['name'] = combined['name'].astype(str).str.strip()
    combined = combined[combined['name'].str.len() > 2]
    combined = combined[combined['name'].str.len() < 100]

    # Remove junk patterns (ENHANCED)
    junk_patterns = [
        r'^\$\d+',                          # Prices like $1.01
        r'^\d+\s*-\s*\d+\s+of',            # Pagination like "1 - 48 of"  
        r'results?$',                       # "841 results"
        r'^[0-9]+$',                        # Pure numbers
        r'^\s*$',                           # Empty strings
        r'cart|sign\s+in|privacy|terms',    # UI elements
        r'mg|capsule|tablet|powder',        # Dosage forms
        r'brand|company|inc|llc',           # Business terms
        r'^\d+\.\d+$',                      # Decimal numbers
        r'add.*cart|view.*detail',          # Shopping cart text
    ]

    # Apply all junk filters
    for pattern in junk_patterns:
        combined = combined[~combined['name'].str.contains(pattern, case=False, regex=True, na=False)]

    # Remove duplicates by case-insensitive name
    combined['name_lower'] = combined['name'].str.lower()
    combined = combined.drop_duplicates(subset=['name_lower']).drop('name_lower', axis=1)
    
    # Sort by category then name
    combined = combined.sort_values(['category', 'name'])
    
    cleaned_count = len(combined)
    print(f"   Removed {original_count - cleaned_count} duplicates/invalid entries")
    
    # Save to CSV
    out_file = DATA_DIR / "master_list.csv"
    combined[['name', 'category']].to_csv(out_file, index=False)
    
    # Print ultimate summary
    print(f"\n🎉 ULTIMATE MASTER LIST COMPLETE!")
    print("=" * 60)
    print(f"📊 TOTAL COMPOUNDS: {len(combined):,}")
    print("=" * 60)
    
    category_counts = combined['category'].value_counts()
    for category, count in category_counts.items():
        percentage = (count / len(combined)) * 100
        print(f"  {category.upper():<12}: {count:,} compounds ({percentage:.1f}%)")
    
    print("=" * 60)
    print(f"💾 Saved to: {out_file}")
    print("=" * 60)
    
    # Show samples from each category
    print(f"\n📋 SAMPLE COMPOUNDS BY CATEGORY:")
    print("-" * 60)
    for category in combined['category'].unique():
        samples = combined[combined['category'] == category]['name'].head(8).tolist()
        print(f"  {category.upper()}: {', '.join(samples)}...")
    
    print("\n✅ READY FOR LITERATURE FETCHING!")
    return combined

if __name__ == "__main__":
    build_ultimate_master()
