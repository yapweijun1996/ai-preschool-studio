import { common } from './common';
import { pages } from './pages';
import { shell } from './shell';

// English is the source of truth; zh and ms must provide every key (enforced by Dict).
export const en = { common, shell, pages };

type Deep<T> = { [K in keyof T]: T[K] extends string ? string : Deep<T[K]> };
export type Dict = Deep<typeof en>;
