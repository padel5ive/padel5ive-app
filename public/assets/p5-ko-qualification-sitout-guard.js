/* PADEL 5IVE — PR34 KO qualifier eligibility guard.
 * Additive adapter, never changes locked canonical 4.8.92.23 KO DAG.
 * Sit Out is a hard exclusion for Stage 2 until moderator returns participant Active.
 */
(function(root){
 'use strict';
 const master=root.P5KO;
 if(!master||typeof master.start!=='function')throw Error('Canonical KO master must be loaded before qualification guard');
 if(master.qualifierSitoutGuard==='lab1')return;
 const start=(state,format,selectedIds=null)=>{
  if(Array.isArray(selectedIds)&&selectedIds.some(id=>(state.sitout||[]).includes(id)))
   throw Error('Sit Out participants cannot enter Knockout. Return Active first.');
  return master.start(state,format,selectedIds);
 };
 root.P5KO=Object.freeze({...master,start,qualifierSitoutGuard:'lab1'});
})(window);
