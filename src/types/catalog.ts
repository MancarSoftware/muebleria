export type Category='Sofás'|'Camas'|'Mesas de comedor'|'Sillas'|'Mesas de centro'|'Oficina'|'Decoración';
export type Product={id:string;slug:string;name:string;category:Category;price:number;description:string;images:string[];materials:string[];dimensions:string;colors:string[];featured:boolean;tags:string[]};
