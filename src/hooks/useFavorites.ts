import {useEffect,useState} from 'react';
export function useFavorites(){const [ids,setIds]=useState<string[]>(()=>JSON.parse(localStorage.getItem('casa-favorites')||'[]'));useEffect(()=>localStorage.setItem('casa-favorites',JSON.stringify(ids)),[ids]);return {ids,toggle:(id:string)=>setIds(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])};}
