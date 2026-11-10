"""Read-only PDF/source inventory; writes planning evidence, never app assets."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, re, subprocess
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
SOURCE = Path(r'C:\Users\PC\Downloads\Zayd landing page all details.pdf')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
reader = PdfReader(SOURCE)
(OUT / 'source').mkdir(exist_ok=True)
(OUT / 'reference-images').mkdir(exist_ok=True)
pages = [p.extract_text() or '' for p in reader.pages]
(OUT / 'source' / 'pdf-text.txt').write_text('\n\n'.join(f'PAGE {i+1}\n{text}' for i,text in enumerate(pages)), encoding='utf-8')
source_files = sorted(p for p in (ROOT / 'src').rglob('*') if p.is_file())
configs = ['package.json','pnpm-lock.yaml','vite.config.ts','index.html','netlify.toml','vercel.json','eslint.config.js','tsconfig.app.json']
source_hashes = {p.relative_to(ROOT).as_posix(): sha(p) for p in source_files}
for name in configs:
    source_hashes[name] = sha(ROOT/name)
manifest = {
    'capturedAtUtc': datetime.now(timezone.utc).isoformat(),
    'pdf': {'path':str(SOURCE),'sha256':sha(SOURCE),'bytes':SOURCE.stat().st_size,'pages':len(pages),
            'role':'current user-supplied specification; previous 22-page PDF is historical only',
            'pageTextSha256':[hashlib.sha256(t.encode('utf-8')).hexdigest() for t in pages]},
    'gitHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
    'initialWorkingTree':'Only LANDING_PAGE_IMPLEMENTATION_PLAN.md untracked before P0; no application edits',
    'applicationAndConfigSha256':source_hashes,
    'runtimeCodeChanged':False,
}
(OUT/'source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def describe(p):
    row={'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
    try:
        with Image.open(p) as im: row.update(width=im.width,height=im.height,format=im.format)
    except Exception:
        if p.suffix.lower()=='.svg':
            text=p.read_text(encoding='utf-8'); row['viewBox']=(re.search(r'viewBox=[\"\']([^\"\']+)',text) or [None,None])[1]
    return row

active_files=['Main.tsx','hero-section.tsx','navbar.tsx','video-showcase-section.tsx','comparison-section.tsx','curriculum-section.tsx','personalized-learning-section.tsx','zayd-life-section.tsx','future-skills-section.tsx','impact-stats-section.tsx','pricing-section.tsx','schools-section.tsx','faq-section.tsx','final-cta-section.tsx','footer.tsx']
assets={}
for name in active_files:
    source=(ROOT/'src/pages/public'/name).read_text(encoding='utf-8')
    for imported in re.findall(r'[\"\'](@/assets/[^\"\']+)[\"\']',source):
        p=ROOT/'src'/imported[2:]
        row=assets.setdefault(p.as_posix(),{**describe(p),'usedBy':[],'status':'existing asset; not newly approved reference replacement'})
        row['usedBy'].append('src/pages/public/'+name)

pair_map={}
for page_number in [10,11]:
    for j,embedded in enumerate(reader.pages[page_number-1].images):
        slide_start=5+((page_number-10)*4)+(j*2)
        name=f'slides-{slide_start}-{slide_start+1}-pair.png'
        target=OUT/'reference-images'/name
        embedded.image.save(target)
        pair_map[slide_start]={'file':target.relative_to(ROOT).as_posix(),'width':embedded.image.width,'height':embedded.image.height,'pdfPage':page_number,'sha256':sha(target)}
        pair_map[slide_start+1]=pair_map[slide_start]

screens=[]
details=[
    (5,'Reading aloud','Reading secondary / S7 reference','قراءة جملة بصوت مرتفع مع تقييم النطق','secondary mapping proposed'),
    (6,'Grammar flashcards','القواعد','بطاقات القواعد في وحدة Big Changes','direct PDF mapping'),
    (7,'Listening narration','الاستماع','مقطع استماع مع موجة صوتية وأسئلة فهم','direct PDF mapping'),
    (8,'Roleplay conversation','المحادثة','محادثة مع زيد تتضمن تلميحات وتغذية راجعة','direct PDF mapping'),
    (9,'Reading passage','القراءة','نص قراءة من المنهج مع خيار الاستماع','direct PDF mapping'),
    (10,'Writing builder','الكتابة','بناء فقرة كتابية باستخدام أسئلة إرشادية','direct PDF mapping'),
    (11,'Form meaning function','الصيغة والمعنى والاستخدام','جدول مرجعي للقواعد والصيغة والمعنى والاستخدام','direct PDF mapping'),
    (12,'Debate topics','الاستماع والمناقشة / التحدث عن الذات','موضوعات نقاش مصورة لممارسة التحدث','D03 unresolved shared mapping'),
]
for slide,title,tab,alt,status in details:
    screens.append({'id':f'screenshot-slide-{slide}','source':pair_map[slide],'title':title,'tab':tab,'proposedAltText':alt,
                    'mappingStatus':status,'availability':'embedded paired reference available; standalone export not supplied',
                    'suitability':'review reference only until original export quality and privacy reviewed; pair contains two screenshots and framing',
                    'individualScreenDimensions':None,'dependency':'D03 / E04'})

clips=[]
for i,(key,label) in enumerate([('airport','في المطار'),('restaurant','في المطعم'),('market','في السوق'),('travel','أثناء السفر'),('social','في المواقف الاجتماعية'),('other','ومواقف أخرى كثيرة')]):
    clips.append({'id':'dialogue-'+key,'label':label,'source':None,'durationSec':None,'format':None,'transcript':None,'status':'missing input',
                  'proposedControlLabel':'استمع إلى حوار: '+label,'dependency':'E01',
                  'note':'sixth scenario not described in PDF audio category list' if key=='other' else 'No approved local dialogue audio/transcript supplied'})
new_icons=[]
for key,meaning,candidate in [('cefr','CEFR assessment','Lucide Gauge or ChartNoAxesCombined'),('avatar','3D Avatar modes','Lucide Box or existing approved avatar art'),('certificates','Certificates and badges','Lucide Award'),('rewards','Points and rewards','Lucide Trophy')]:
    new_icons.append({'id':'feature-icon-'+key,'meaning':meaning,'source':None,'dimensions':None,'status':'missing approved icon; library-based candidate is a proposal',
                      'candidate':candidate,'altText':'Decorative when adjacent text conveys the feature; use aria-hidden','dependency':'D05'})
media=[describe(p) for folder in [ROOT/'src',ROOT/'public'] for p in folder.rglob('*') if p.is_file() and p.suffix.lower() in ['.mp3','.wav','.ogg','.m4a','.webm','.mp4']]
guide_candidates=[{**describe(p),'status':'existing guide screenshot; not the approved S6B slide reference; privacy/accuracy unreviewed'} for p in (ROOT/'src/assets/user-guide').rglob('*.png')]
inventory={
    'capturedAtUtc':datetime.now(timezone.utc).isoformat(),'sourcePdfSha256':manifest['pdf']['sha256'],
    'existingActiveLandingAssets':list(assets.values()),'requiredScreenshotReferences':screens,'requiredDialogueClips':clips,
    'requiredDemoPrompts':[
        {'id':'reading-prompt','source':'p12, p28 item 4','text':None,'status':'exact approved English sentence missing; existing public reading demo is server-provided','dependency':'D04','suitability':'Reuse only after product/content review'},
        {'id':'speaking-prompt','source':'p12, p28 item 4','text':None,'status':'exact approved English prompt missing; existing roleplay demo advertises cafe conversation','dependency':'D04','suitability':'Cafe scenario is not an approved replacement sentence'}],
    'requiredNewFeatureIcons':new_icons,
    'optionalSmartDashboardGraphics':[
        {'id':'admin-dashboard','source':None,'dimensions':None,'status':'no approved standalone admin screenshot supplied; optional per D08','caption':'لوحة الإدارة المدرسية'},
        {'id':'teacher-dashboard','source':'src/assets/landing-page/section9.png','status':'existing composite illustration available; optional standalone screenshot not selected','caption':'لوحة متابعة المعلم'},
        {'id':'student-leaderboard','source':'src/assets/user-guide/leaderboard/','status':'existing candidates available; no selected approved image','caption':'لوحة الشرف والمكافآت'}],
    'otherRequiredAssets':[{'id':'promotional-video','source':None,'status':'missing source; current S4 intentionally disabled preview; preservation baseline, not P0 authoring','durationTarget':'70 seconds'}],
    'localMediaFiles':media,'existingGuideScreenshotCandidates':guide_candidates,
}
(OUT/'asset-inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pdfPages':len(pages),'pdfSha256':manifest['pdf']['sha256'],'sourceFilesFrozen':len(source_hashes),'activeAssets':len(assets),'screenshotReferences':len(screens),'missingDialogueClips':len(clips),'newFeatureIcons':len(new_icons),'localMediaFiles':[r['path'] for r in media]},ensure_ascii=False,indent=2))
