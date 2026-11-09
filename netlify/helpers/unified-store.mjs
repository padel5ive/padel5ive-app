/* PADEL 5IVE — results storage boundary.
 * Production retains the original site-wide store and all existing result IDs.
 * Netlify preview/branch subdomains receive a separate stable test namespace;
 * QA publish/update/revoke cannot mutate the production results store.
 */
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
const PRODUCTION_STORE='padel5ive-unified-results-5-4-13';
export function resultsStore(request){
 const host=new URL(request.url).hostname.toLowerCase();
 const preview=/^(?:deploy-preview-[0-9]+|[a-z0-9-]+)--padel5ive\.netlify\.app$/.test(host);
 const suffix=preview?'-qa-'+createHash('sha256').update(host).digest('hex').slice(0,10):'';
 return getStore(PRODUCTION_STORE+suffix,{consistency:'strong'});
}
