# tasks/03_generate_summaries.py
import os, time, sys, json
sys.path.append(".")
from db import SessionLocal, init_db
from models import Compound, Study, CompoundSummary
from ai import call_llm   # wrapper shown below

def make_prompt(compound, studies):
    short = [{k:v for k,v in s.__dict__.items() if k in ("pmid","title","abstract","study_type","publication_year")} for s in studies]
    return (
        f"Create an evidence-based JSON summary for {compound.name}. "
        f"Use ONLY these studies:\n{json.dumps(short, indent=1)[:6000]}\n\n"
        "Respond in JSON with keys overview, mechanism, benefits, side_effects, interactions, contraindications, references."
    )

def main():
    init_db()
    db = SessionLocal()
    for cmpd in db.query(Compound).all():
        if db.query(CompoundSummary).filter_by(compound_id=cmpd.id).first():
            continue
        studies = db.query(Study).filter_by(compound_id=cmpd.id).limit(20).all()
        if not studies:
            continue
        prompt = make_prompt(cmpd, studies)
        summary_json = call_llm(prompt)
        if summary_json:
            db.add( CompoundSummary(compound_id=cmpd.id, **summary_json) )
            db.commit()
            print(f"✅ Summary stored for {cmpd.name}")
            time.sleep(1.2)  # stay under TPM
    db.close()

if __name__ == "__main__":
    main()
