(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "fa-vendor-registration-v2";
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_TOTAL_FILE_SIZE = 20 * 1024 * 1024;
  const ALLOWED_TYPES = new Set(["application/pdf","image/jpeg","image/png","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
  const COUNTRY_LIST = ["🇮🇳 India","🇺🇸 United States","🇬🇧 United Kingdom","🇩🇪 Germany","🇦🇺 Australia","🇦🇪 United Arab Emirates","🇸🇬 Singapore","🇨🇦 Canada","🇫🇷 France","🇳🇱 Netherlands","🇯🇵 Japan","🇿🇦 South Africa","🇮🇪 Ireland","🇳🇿 New Zealand","🇨🇭 Switzerland","🇸🇪 Sweden","🇧🇷 Brazil","🇲🇽 Mexico","🇵🇭 Philippines","🇲🇾 Malaysia","🇮🇩 Indonesia","🇸🇦 Saudi Arabia","🇶🇦 Qatar","🇰🇪 Kenya","🇳🇬 Nigeria"];
  let currentStep = 0;
  let questionnaire = {};
  let uploadedFiles = [];
  let submitting = false;
  let toastTimer;
  const fileInputCategories = ["Business Registration Certificate","Tax Certificate","Insurance Certificate","Other Supporting Documents"];

  function openFileDB() {
    return new Promise((resolve,reject)=>{
      if(!("indexedDB" in window)) return resolve(null);
      const request=indexedDB.open("fa-vendor-registration",1);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains("uploads"))request.result.createObjectStore("uploads",{keyPath:"id"});};
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    });
  }
  async function persistFiles() {
    try { const db=await openFileDB();if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction("uploads","readwrite");const store=tx.objectStore("uploads");store.clear();uploadedFiles.forEach(item=>store.put(item));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close(); }
    catch(error){console.warn("Could not persist selected documents locally:",error);}
  }
  async function restoreFiles() {
    try { const db=await openFileDB();if(!db)return;uploadedFiles=await new Promise((resolve,reject)=>{const tx=db.transaction("uploads","readonly");const request=tx.objectStore("uploads").getAll();request.onsuccess=()=>resolve(request.result||[]);request.onerror=()=>reject(request.error);});db.close();if(uploadedFiles.length)questionnaire.supportingDocs=uploadedFiles.map(item=>item.file); }
    catch(error){console.warn("Could not restore selected documents:",error);uploadedFiles=[];}
  }
  async function clearPersistedFiles(){try{const db=await openFileDB();if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction("uploads","readwrite");tx.objectStore("uploads").clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}catch(_){}}
  async function loadSaved() {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); if (saved && saved.data) { questionnaire = saved.data; currentStep = Math.min(Number(saved.step) || 0, 4); } }
    catch (_) { localStorage.removeItem(STORAGE_KEY); }
    await restoreFiles();
  }
  function saveProgress() {
    const { supportingDocs, ...safeData } = questionnaire;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({data:safeData,step:currentStep,updatedAt:new Date().toISOString()})); $('saveStatus').textContent = "Saved just now"; }
    catch (_) { $('saveStatus').textContent = "Unable to save on this device"; }
  }
  function toast(message, kind="info") { const el=$('toast'); el.textContent=message; el.className=`toast show ${kind}`; clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.className="toast",3600); }
  function escapeHTML(value) { return String(value ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function startRegistration() { $('home').hidden=true; $('registration').hidden=false; renderStep(); window.scrollTo({top:0,behavior:"smooth"}); }
  function updateStepNavigation() {
    $('stepNavigation').innerHTML=portalSteps.map((step,i)=>`<div class="step-nav-item ${i===currentStep?'active':''} ${i<currentStep?'complete':''}" ${i===currentStep?'aria-current="step"':''}><span class="step-marker">${i<currentStep?'✓':String(i+1).padStart(2,'0')}</span><span class="step-nav-copy"><strong>${escapeHTML(step.title)}</strong><small>${i<currentStep?'Completed':i===currentStep?'In progress':'Not started'}</small></span></div>`).join("");
    $('stepCount').textContent=`${String(currentStep+1).padStart(2,'0')} / 05`;
  }
  function renderField(q) {
    const value=questionnaire[q.id] || ""; const req=q.required?'<span class="required-star">*</span>':'';
    let control="";
    if(q.type==="country") control=`<select id="${q.id}" name="${q.id}" required><option value="">${escapeHTML(q.placeholder)}</option>${COUNTRY_LIST.map(c=>{const name=c.replace(/^\S+\s/,"");return `<option value="${escapeHTML(name)}" ${value===name?'selected':''}>${escapeHTML(c)}</option>`;}).join("")}</select>`;
    else control=`<input id="${q.id}" name="${q.id}" type="${q.type}" value="${escapeHTML(value)}" placeholder="${escapeHTML(q.placeholder||'')}" ${q.autocomplete?`autocomplete="${q.autocomplete}"`:''} ${q.type==="url"?'inputmode="url"':''} ${q.type==="tel"?'inputmode="tel"':''} ${q.required?'required':''}>`;
    return `<div class="field" data-field="${q.id}"><label for="${q.id}">${escapeHTML(q.label)} ${req}</label><div class="input-wrap">${control}</div>${q.hint?`<small class="field-hint">${escapeHTML(q.hint)}</small>`:''}<small class="field-error" id="error-${q.id}" aria-live="polite"></small></div>`;
  }
  function renderDocuments() {
    const grouped=fileInputCategories.map((category,index)=>{
      const files=uploadedFiles.filter(f=>f.category===category);
      return `<div class="upload-category"><div class="upload-category-head"><div><strong>${category}</strong><small>${index===0?'Required for company verification':index===1?'Required for tax verification':index===2?'If applicable to your business':'Any additional relevant files'}</small></div><span class="file-count">${files.length} ${files.length===1?'file':'files'}</span></div><label class="drop-zone" for="upload-${index}"><input type="file" id="upload-${index}" data-category="${category}" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple><span class="upload-icon">↑</span><span><strong>Choose files</strong> or drag and drop</span><small>PDF, JPG, PNG, DOC, DOCX · Up to 10 MB each</small></label>${files.map(f=>`<div class="uploaded-file"><span class="file-type">${escapeHTML(f.file.name.split('.').pop().toUpperCase())}</span><span class="uploaded-name"><strong>${escapeHTML(f.file.name)}</strong><small>${formatBytes(f.file.size)}</small></span><button type="button" class="remove-file" data-file-id="${f.id}" aria-label="Remove ${escapeHTML(f.file.name)}">×</button></div>`).join('')}</div>`;
    }).join('');
    return `<div class="document-intro"><div class="document-symbol">▤</div><div><strong>Keep your documents ready</strong><p>Upload clear, current copies. You can add multiple files in each category.</p></div></div><div class="upload-groups">${grouped}</div><small class="field-error" id="error-supportingDocs" aria-live="polite"></small>`;
  }
  function formatBytes(bytes) { if(bytes<1024) return `${bytes} B`; if(bytes<1048576) return `${(bytes/1024).toFixed(0)} KB`; return `${(bytes/1048576).toFixed(1)} MB`; }
  function renderReviewSection(stepIndex) {
    const step=portalSteps[stepIndex];
    const rows=stepIndex===3?'':step.questions.map(q=>`<div class="review-field"><span>${escapeHTML(q.label)}</span><strong>${escapeHTML(questionnaire[q.id]||'Not provided')}</strong></div>`).join('');
    const docs=stepIndex===3?uploadedFiles.map(f=>`<div class="review-file"><span>▤</span><div><strong>${escapeHTML(f.file.name)}</strong><small>${escapeHTML(f.category)} · ${formatBytes(f.file.size)}</small></div></div>`).join(''):`<div class="review-field"><span>Supporting documents</span><strong>${uploadedFiles.length} file(s) uploaded</strong></div>`;
    return `<section class="review-section"><div class="review-section-head"><div><span class="panel-kicker">${String(stepIndex+1).padStart(2,'0')}</span><h3>${escapeHTML(step.title)}</h3></div><button type="button" class="edit-button" data-edit-step="${stepIndex}">Edit section ↗</button></div>${stepIndex===3?`<div class="review-files">${docs}</div>`:`<div class="review-grid">${rows}</div>`}</section>`;
  }
  function renderReview() {
    return `<div class="review-intro"><div class="review-shield">✓</div><div><strong>One last check</strong><p>Please make sure the details below are accurate before submitting.</p></div></div>${[0,1,2,3].map(renderReviewSection).join('')}<label class="declaration"><input type="checkbox" id="declaration"><span>I confirm that the information provided is accurate and complete to the best of my knowledge, and I am authorised to submit this registration on behalf of the organisation.</span></label><small class="field-error" id="error-declaration" aria-live="polite"></small><div id="submitError" class="submit-error" hidden></div>`;
  }
  function renderStep() {
    const step=portalSteps[currentStep]; updateStepNavigation();
    $('stepEyebrow').textContent=`STEP ${String(currentStep+1).padStart(2,'0')}`; $('stepTitle').textContent=step.title; $('stepDescription').textContent=step.description;
    const pct=Math.round(((currentStep+1)/5)*100); $('progressFill').style.width=`${pct}%`; $('completionPercent').textContent=`${pct}%`;
    $('stepContent').innerHTML=currentStep===4?renderReview():currentStep===3?renderDocuments():`<div class="fields-grid ${step.questions.length===2?'two-fields':''}">${step.questions.map(renderField).join('')}</div>`;
    $('backButton').disabled=currentStep===0; $('continueButton').innerHTML=currentStep===4?'Submit registration <span>→</span>':'Continue <span>→</span>'; $('continueButton').classList.toggle('submit-button',currentStep===4);
    $('continueButton').disabled=false;
    if(currentStep===4) $('backButton').hidden=false;
    if(currentStep===3) bindFileInputs();
    if(currentStep===4) $('stepContent').querySelectorAll('[data-edit-step]').forEach(btn=>btn.addEventListener('click',()=>{currentStep=Number(btn.dataset.editStep);saveProgress();renderStep();window.scrollTo({top:0,behavior:'smooth'});}));
    if(currentStep<3) step.questions.forEach(q=>{const el=$(q.id);if(el){el.addEventListener('input',()=>{questionnaire[q.id]=el.value;clearError(q.id);saveProgress();});el.addEventListener('change',()=>{questionnaire[q.id]=el.value;clearError(q.id);saveProgress();});}});
  }
  function bindFileInputs() {
    document.querySelectorAll('.drop-zone').forEach(zone=>{zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over');});zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-over');addFiles(e.dataTransfer.files,zone.querySelector('input').dataset.category);});});
    document.querySelectorAll('.drop-zone input').forEach(input=>input.addEventListener('change',()=>{addFiles(input.files,input.dataset.category);input.value='';}));
    document.querySelectorAll('.remove-file').forEach(btn=>btn.addEventListener('click',()=>{uploadedFiles=uploadedFiles.filter(f=>f.id!==btn.dataset.fileId);syncSupportingDocs();persistFiles();renderStep();}));
  }
  function addFiles(fileList,category) {
    const files=Array.from(fileList); let added=0;
    for(const file of files){const ext=file.name.split('.').pop().toLowerCase();const valid=ALLOWED_TYPES.has(file.type)||["pdf","jpg","jpeg","png","doc","docx"].includes(ext);if(!valid){toast(`${file.name}: file type not supported.`,"error");continue;}if(file.size>MAX_FILE_SIZE){toast(`${file.name}: exceeds the 10 MB limit.`,"error");continue;}if(uploadedFiles.some(f=>f.file.name===file.name&&f.file.size===file.size&&f.category===category)){toast(`${file.name} is already added.`);continue;}if(uploadedFiles.reduce((sum,item)=>sum+item.file.size,0)+file.size>MAX_TOTAL_FILE_SIZE){toast("The total upload limit is 20 MB. Remove a file before adding another.","error");continue;}uploadedFiles.push({id:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`,file,category});added++;}
    syncSupportingDocs();persistFiles(); if(added) toast(`${added} file${added===1?'':'s'} added successfully.`,"success");renderStep();
  }
  function syncSupportingDocs(){questionnaire.supportingDocs=uploadedFiles.map(x=>x.file);saveProgress();}
  function clearError(id){const err=$(`error-${id}`);if(err)err.textContent='';const field=document.querySelector(`[data-field="${id}"]`);if(field)field.classList.remove('invalid');}
  function setError(id,message){const err=$(`error-${id}`);if(err)err.textContent=message;const field=document.querySelector(`[data-field="${id}"]`);if(field)field.classList.add('invalid');}
  function validateStep() {
    let valid=true; const step=portalSteps[currentStep];
    if(currentStep===3){if(!uploadedFiles.length){$('error-supportingDocs').textContent='Please upload at least one supporting document.';valid=false;}else $('error-supportingDocs').textContent='';return valid;}
    if(currentStep===4){const check=$('declaration');if(!check.checked){$('error-declaration').textContent='Please confirm the declaration before submitting.';valid=false;}else $('error-declaration').textContent='';return valid;}
    step.questions.forEach(q=>{const el=$(q.id);const value=(el.value||'').trim();let error='';if(q.required&&!value)error='This field is required.';else if(q.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))error='Enter a valid email address.';else if(q.type==='url'){try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol))throw 0;}catch(_){error='Enter a valid website address, including https://.';}}else if(q.type==='tel'&&!/^[+()\d\s.-]{7,20}$/.test(value))error='Enter a valid phone number with country code.';setError(q.id,error);if(error)valid=false;else questionnaire[q.id]=value;});
    if(!valid){const first=document.querySelector('.field.invalid input,.field.invalid select');if(first)first.focus();}saveProgress();return valid;
  }
  function nextStep(){if(submitting)return;if(!validateStep())return;if(currentStep<4){currentStep++;saveProgress();renderStep();window.scrollTo({top:0,behavior:'smooth'});}else submitPortal();}
  function previousStep(){if(currentStep>0){currentStep--;saveProgress();renderStep();window.scrollTo({top:0,behavior:'smooth'});}}
  function convertFileToBase64(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error(`Unable to read ${file.name}`));reader.readAsDataURL(file);});}
  async function submitPortal(){
    if(submitting||!validateStep())return;const endpoint=window.PORTAL_CONFIG?.submissionEndpoint;if(!endpoint){showSubmitError('Submission service is not configured. Please contact the portal administrator.');return;}
    submitting=true;$('loadingOverlay').hidden=false;$('continueButton').disabled=true;$('backButton').disabled=true;
    try{
      // Backward-compatible Power Automate body: original form keys plus attachments[].
      const payload={...questionnaire,attachments:[]};delete payload.supportingDocs;
      for(const item of uploadedFiles){payload.attachments.push({name:item.file.name,type:item.file.type||'application/octet-stream',size:item.file.size,content:await convertFileToBase64(item.file)});}
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const responseText=await response.text();let responseData={};try{responseData=responseText?JSON.parse(responseText):{};}catch(_){responseData={message:responseText};}
      if(!response.ok)throw new Error(responseData.message||responseData.error||`The submission service returned an error (${response.status}).`);
      if(responseData.success===false||responseData.status==='failed'||responseData.status==='error'||(typeof responseData.message==='string'&&/^(failed|failure|error)\b/i.test(responseData.message.trim())))throw new Error(responseData.message||'The submission service could not confirm your registration.');
      showSuccess(responseData);
    }catch(error){console.error('Vendor registration submission failed:',error);showSubmitError(error.message||'We could not submit your registration. Please try again.');}
    finally{submitting=false;$('loadingOverlay').hidden=true;$('continueButton').disabled=false;$('backButton').disabled=false;}
  }
  function showSubmitError(message){const el=$('submitError');el.textContent=message;el.hidden=false;el.scrollIntoView({behavior:'smooth',block:'center'});}
  function showSuccess(data){$('registration').hidden=true;$('successScreen').hidden=false;$('successMessage').textContent=data.message||'Thank you. Your vendor registration has been received for processing.';const ref=data.registrationReference||data.referenceNumber||data.reference||data.id;if(ref){$('referenceValue').textContent=ref;$('referenceBox').hidden=false;}localStorage.removeItem(STORAGE_KEY);clearPersistedFiles();window.scrollTo({top:0,behavior:'smooth'});}
  function saveExit(){saveProgress();$('registration').hidden=true;$('home').hidden=false;toast('Your progress has been saved on this device.','success');window.scrollTo({top:0,behavior:'smooth'});}
  $('startButton').addEventListener('click',startRegistration);$('continueButton').addEventListener('click',nextStep);$('backButton').addEventListener('click',previousStep);$('saveExitButton').addEventListener('click',saveExit);$('returnHomeButton').addEventListener('click',()=>{ $('successScreen').hidden=true;$('home').hidden=false;window.scrollTo({top:0,behavior:'smooth'});});$('year').textContent=new Date().getFullYear();
  loadSaved().then(()=>{if(Object.keys(questionnaire).length){$('startButton').innerHTML='Continue registration <span aria-hidden="true">→</span>';$('startButton').addEventListener('click',()=>toast('Your saved form details have been restored.'),{once:true});}});
})();
