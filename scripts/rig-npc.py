# Run: blender -b --factory-startup --python scripts/rig-npc.py   (edit SRC and PICK below; pack ids are 001-014)
# Rig two characters from the Citizen NPC pack (00amza, CC-BY-4.0): join head+body, build a skeleton from the body's own
# proportions, skin by distance to the bones, make Idle and Walk loops, shrink textures, export one GLB each.
import bpy, bmesh, mathutils, math, re, os, sys, json
from mathutils import Vector, Quaternion, Matrix
SRC=r"C:\Users\Fred\Downloads\citizen_npc_pack_1_character_lowpoly_mobile.glb"
OUT=r"C:\Users\Fred\Documents\sunfield-farm\public\models"
PICK={'%03d'%i:'npc_%03d'%i for i in range(1,15)}   # 006, 010, 012: the palengke and hardware boys; the rest: townspeople
os.makedirs(OUT,exist_ok=True)
log=[]

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SRC)
    bpy.context.view_layer.update()

def build(key,name):
    fresh()
    objs=[o for o in bpy.data.objects if o.type=='MESH' and re.search(r'00amza_%s_'%key,o.name)]
    # keep only this character: unparent with transforms kept, delete everything else
    for o in objs:
        mw=o.matrix_world.copy(); o.parent=None; o.matrix_world=mw
    for o in list(bpy.data.objects):
        if o not in objs: bpy.data.objects.remove(o,do_unlink=True)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active=objs[0]
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bpy.ops.object.join(); me=bpy.context.view_layer.objects.active; me.name=name
    # stand it at the origin, feet on the ground
    vs=[v.co for v in me.data.vertices]; cx=(min(v.x for v in vs)+max(v.x for v in vs))/2; cy=(min(v.y for v in vs)+max(v.y for v in vs))/2; z0=min(v.z for v in vs)
    for v in me.data.vertices: v.co-=Vector((cx,cy,z0))
    vs=[v.co for v in me.data.vertices]; H=max(v.z for v in vs)
    # landmarks
    hL=max(vs,key=lambda v:v.x); hR=min(vs,key=lambda v:v.x)            # finger tips (character's left is +X, it faces -Y)
    def side_x(z0,z1,sg):
        pts=[v.x for v in vs if z0<v.z<z1 and v.x*sg>0]; return sum(pts)/len(pts) if pts else sg*.05*H
    lx=abs(side_x(.24*H,.32*H,1)+(-side_x(.24*H,.32*H,-1)))/2 or .05*H
    sx, sz = .1*H, .815*H
    J={}
    J['hips']=(Vector((0,0,.5*H)),Vector((0,0,.58*H)))
    J['spine']=(Vector((0,0,.58*H)),Vector((0,0,.68*H)))
    J['chest']=(Vector((0,0,.68*H)),Vector((0,0,.8*H)))
    J['neck']=(Vector((0,0,.8*H)),Vector((0,0,.86*H)))
    J['head']=(Vector((0,0,.86*H)),Vector((0,0,H)))
    for s,sg,tip in (('L',1,hL),('R',-1,hR)):
        sh=Vector((sg*sx,0,sz)); arm=tip-sh
        J['shoulder.'+s]=(Vector((sg*.02*H,0,.79*H)),sh)
        J['upper_arm.'+s]=(sh,sh+arm*.42)
        J['forearm.'+s]=(sh+arm*.42,sh+arm*.76)
        J['hand.'+s]=(sh+arm*.76,tip)
        J['thigh.'+s]=(Vector((sg*lx,0,.5*H)),Vector((sg*lx,0,.275*H)))
        J['shin.'+s]=(Vector((sg*lx,0,.275*H)),Vector((sg*lx,0,.05*H)))
        J['foot.'+s]=(Vector((sg*lx,0,.05*H)),Vector((sg*lx,-.075*H,.012*H)))
    PAR={'spine':'hips','chest':'spine','neck':'chest','head':'neck'}
    for s in 'LR': PAR.update({'shoulder.'+s:'chest','upper_arm.'+s:'shoulder.'+s,'forearm.'+s:'upper_arm.'+s,'hand.'+s:'forearm.'+s,'thigh.'+s:'hips','shin.'+s:'thigh.'+s,'foot.'+s:'shin.'+s})
    arm_d=bpy.data.armatures.new(name+'_rig'); rig=bpy.data.objects.new(name+'_rig',arm_d); bpy.context.scene.collection.objects.link(rig)
    bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); bpy.context.view_layer.objects.active=rig
    bpy.ops.object.mode_set(mode='EDIT')
    for b,(h,t) in J.items():
        eb=arm_d.edit_bones.new(b); eb.head=h; eb.tail=t
    for b,p in PAR.items():
        arm_d.edit_bones[b].parent=arm_d.edit_bones[p]; arm_d.edit_bones[b].use_connect=False
    bpy.ops.object.mode_set(mode='OBJECT')
    # skin: each vertex follows its nearest bones, blended by distance (works on scanned meshes made of separate pieces)
    segs={b:(h,t) for b,(h,t) in J.items()}
    groups={b:me.vertex_groups.new(name=b) for b in J}
    def dseg(p,a,b):
        ab=b-a; u=max(0,min(1,(p-a).dot(ab)/max(ab.length_squared,1e-9))); return (p-(a+ab*u)).length
    for v in me.data.vertices:
        p=v.co; ARM=('shoulder','upper_arm','forearm','hand')
        if abs(p.x)>lx+.075*H and p.z<.8*H: cand=[b for b in segs if b.startswith(ARM)]           # out beside the body: the arms and hands
        elif p.z<.5*H: cand=[b for b in segs if not b.startswith(ARM)]                            # the legs and hips never follow the hands
        else: cand=list(segs)
        d=sorted(((dseg(p,*segs[b]),b) for b in cand))[:3]
        ws=[(1/((x[0]+.015*H)**4),x[1]) for x in d]; tot=sum(w for w,_ in ws)
        for w,b in ws: groups[b].add([v.index],w/tot,'REPLACE')
    mod=me.modifiers.new('rig','ARMATURE'); mod.object=rig; me.parent=rig
    # animation helpers: a rotation about the joint, given in the armature's own axes (Z up, the character faces -Y)
    bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); bpy.context.view_layer.objects.active=rig; bpy.ops.object.mode_set(mode='POSE')
    for pb in rig.pose.bones: pb.rotation_mode='QUATERNION'
    def rot(b,q):
        bn=rig.data.bones[b]; R=bn.matrix_local.to_3x3(); rig.pose.bones[b].rotation_quaternion=(R.inverted()@q.to_matrix()@R).to_quaternion()
    def axis(v,a): return Quaternion(Vector(v),a)
    hinge={}
    for s in 'LR':
        h,t=J['forearm.'+s]; hinge[s]=(t-h).normalized().cross(Vector((0,-1,0))).normalized()   # the elbow bends across the arm, the hand comes forward
    def elbow(s,a): rot('forearm.'+s,Quaternion(hinge[s],a))
    down={}
    for s in 'LR':
        h,t=J['upper_arm.'+s]; cur=(t-h).normalized(); tgt=Vector((.12*(1 if s=='L' else -1),.04,-1)).normalized(); down[s]=cur.rotation_difference(tgt)
    def key(fr):
        for pb in rig.pose.bones:
            pb.keyframe_insert('rotation_quaternion',frame=fr); pb.keyframe_insert('location',frame=fr)
    def clear():
        for pb in rig.pose.bones: pb.rotation_quaternion=(1,0,0,0); pb.location=(0,0,0)
    acts=[]
    def make(nm,frames,pose):
        a=bpy.data.actions.new(nm); a.use_fake_user=True; rig.animation_data_create(); rig.animation_data.action=a
        for fr in frames: clear(); pose(fr); key(fr)
        acts.append(a)
    def idle(fr):
        ph=fr/96*2*math.pi
        for s,sg in (('L',1),('R',-1)): rot('upper_arm.'+s,axis((0,1,0),sg*.03*math.sin(ph))@down[s]); elbow(s,.15)
        rot('chest',axis((1,0,0),.015*math.sin(ph))); rot('spine',axis((0,1,0),.02*math.sin(ph/2))); rot('head',axis((0,0,1),.06*math.sin(ph/2)))
    def walk(fr):
        ph=fr/24*2*math.pi; s1=math.sin(ph)
        for s,sg,k in (('L',1,1),('R',-1,-1)):
            sw=k*s1; rot('thigh.'+s,axis((1,0,0),-.42*sw)); rot('shin.'+s,axis((1,0,0),.55*max(0,math.sin(ph*k+math.pi/2)) if k>0 else .55*max(0,math.sin(-ph+math.pi/2))))
            rot('foot.'+s,axis((1,0,0),-.15*sw)); rot('upper_arm.'+s,axis((1,0,0),.35*sw)@down[s]); elbow(s,.25+.2*max(0,-sw))
        rot('hips',axis((0,0,1),.06*s1)); rot('chest',axis((0,0,1),-.08*s1)); rig.pose.bones['hips'].location=(0,abs(math.cos(ph))*.02*H*0,0)
        hb=rig.pose.bones['hips']; bn=rig.data.bones['hips']; up=Vector((0,0,.012*H*abs(math.cos(ph)))); hb.location=bn.matrix_local.to_3x3().inverted()@up
    def sit(fr):   # on a bench or seat: hips stay where they are, thighs forward, shins down, hands resting on the lap
        ph=fr/96*2*math.pi
        for s,sg in (('L',1),('R',-1)):
            rot('thigh.'+s,axis((1,0,0),-1.5)@axis((0,1,0),sg*.08)); rot('shin.'+s,axis((1,0,0),1.45)); rot('foot.'+s,axis((1,0,0),.05))
            rot('upper_arm.'+s,axis((1,0,0),-.1)@down[s]); elbow(s,.85)
        rot('spine',axis((1,0,0),-.06)); rot('chest',axis((1,0,0),.015*math.sin(ph))); rot('head',axis((0,0,1),.08*math.sin(ph/2)))
    def carry(fr):   # walking with a load held in both hands at the chest
        walk(fr); ph=fr/24*2*math.pi
        for s,sg in (('L',1),('R',-1)): rot('upper_arm.'+s,axis((1,0,0),-.45)@down[s]); elbow(s,1.35)
        rot('chest',axis((1,0,0),.04)); rot('spine',axis((1,0,0),.05))
    make('Idle',range(0,97,8),idle); make('Walk',range(0,25,2),walk); make('Sit',range(0,97,16),sit); make('Carry',range(0,25,2),carry)
    for a in acts:
        tr=rig.animation_data.nla_tracks.new(); tr.name=a.name; tr.strips.new(a.name,0,a); tr.mute=False
    rig.animation_data.action=None
    bpy.ops.object.mode_set(mode='OBJECT')
    # smaller textures for phones
    headim={n.image.name for n in (me.material_slots[max(me.data.polygons,key=lambda p:p.center.z).material_index].material.node_tree.nodes) if n.type=='TEX_IMAGE' and n.image}
    for im in bpy.data.images:
        t=256 if im.name in headim else 512   # the head is small on screen
        if im.size[0]>t: im.scale(t,t)
    if STYLE: sketch(me,H)
    out=os.path.join(OUT,name+'.glb')
    bpy.ops.object.select_all(action='SELECT')
    kw=dict(filepath=out,export_format='GLB',use_selection=True,export_animations=True,export_skins=True,export_image_format='JPEG',export_yup=True,export_apply=False)
    try: bpy.ops.export_scene.gltf(**kw,export_animation_mode='NLA_TRACKS',export_jpeg_quality=80)
    except TypeError as e:
        log.append('retry export: '+str(e)); bpy.ops.export_scene.gltf(**kw)
    log.append({name:{'H':round(H,3),'verts':len(me.data.vertices),'bytes':os.path.getsize(out),'actions':[a.name for a in acts]}})

import numpy as np
STYLE=False   # True: the drawn look: no painted face, softened, flat tones (the game's ink pass draws the outlines)
def sketch(me,H):
    imgs={}
    for i,s in enumerate(me.material_slots):
        for n in (s.material.node_tree.nodes if s.material and s.material.use_nodes else []):
            if n.type=='TEX_IMAGE' and n.image: imgs[i]=n.image
    arr={}
    for im in set(imgs.values()):
        w,h=im.size; arr[im.name]=(im,np.array(im.pixels[:],dtype=np.float32).reshape(h,w,4))
    # 1. the face: the front of the head between chin and brow, filled with the person's own skin tone
    uvl=me.data.uv_layers.active.data; masks={}; headm=max(me.data.polygons,key=lambda p:p.center.z).material_index   # the head's own material
    for p in me.data.polygons:
        c=p.center; im=imgs.get(p.material_index)
        if not im or p.material_index!=headm or not (.835*H<c.z<.952*H and p.normal.y<-.28 and abs(c.x)<.06*H): continue
        a=arr[im.name][1]; hh,ww=a.shape[:2]; m=masks.setdefault(im.name,np.zeros((hh,ww),bool))
        uv=[uvl[li].uv for li in p.loop_indices]
        for t in range(1,len(uv)-1):
            P=np.array([[uv[0].x*ww,uv[0].y*hh],[uv[t].x*ww,uv[t].y*hh],[uv[t+1].x*ww,uv[t+1].y*hh]])
            x0,y0=np.floor(P.min(0)).astype(int); x1,y1=np.ceil(P.max(0)).astype(int); x0,y0=max(x0-1,0),max(y0-1,0); x1,y1=min(x1+1,ww-1),min(y1+1,hh-1)
            ys,xs=np.mgrid[y0:y1+1,x0:x1+1]; px,py=xs+.5,ys+.5
            (ax,ay),(bx,by),(cx,cy)=P; d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
            if abs(d)<1e-9: continue
            l1=((by-cy)*(px-cx)+(cx-bx)*(py-cy))/d; l2=((cy-ay)*(px-cx)+(ax-cx)*(py-cy))/d; l3=1-l1-l2
            inside=(l1>=-.04)&(l2>=-.04)&(l3>=-.04); m[y0:y1+1,x0:x1+1]|=inside
    def blur(a,r):
        out=a.copy()
        for ax in (0,1):
            c=np.cumsum(np.pad(out,[(r+1,r) if i==ax else (0,0) for i in range(3)],mode='edge'),axis=ax)
            sl=lambda s,e:[slice(s,e) if i==ax else slice(None) for i in range(3)]
            n=out.shape[ax]; out=(c[tuple(sl(2*r+1,2*r+1+n))]-c[tuple(sl(0,n))])/(2*r+1)
        return out
    for nm,(im,a) in arr.items():
        rgb=a[:,:,:3]
        if nm in masks:
            m=masks[nm]; px=rgb[m]; lum=px.mean(1); sel=px[(lum>.25)&(lum<.92)]
            skin=np.median(sel if len(sel) else px,axis=0); rgb[m]=skin
            soft=blur(m[:,:,None].astype(np.float32).repeat(3,2),6); rgb[:]=rgb*(1-soft*.85)+skin*soft*.85   # no hard edge round the face
        sm=blur(rgb,2)                                           # soften the photo detail
        q=np.round(sm*6)/6                                       # a few flat tones per colour
        g=q.mean(2,keepdims=True); q=g+(q-g)*.85                 # a touch less saturated, like the game's palette
        a[:,:,:3]=np.clip(q,0,1); im.pixels[:]=a.ravel(); im.update()
    log.append({'sketch':{k:int(v.sum()) for k,v in masks.items()}})

for k,n in PICK.items():
    try: build(k,n)
    except Exception as e:
        import traceback; log.append('FAIL '+k+': '+traceback.format_exc())
print('LOG>'+json.dumps(log,default=str))
