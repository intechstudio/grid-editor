import { writable, get } from 'svelte/store';

export const monaco_elementtype = writable()

export function find_forbidden_identifiers(str){

	const identifier_match_expr = /[a-zA-Z0-9_]+/g

	const identifiers = str.match(identifier_match_expr)

	let forbiddenCount = 0;
	let forbiddenList = [];

	if (identifiers !== undefined && identifiers !== null){

		identifiers.forEach(element => {
		
			if (language.forbiddens.find(e => e==element)){
				forbiddenCount++;
				forbiddenList.push(element);
			}

		});
	}

	return forbiddenList;

}

