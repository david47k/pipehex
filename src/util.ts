/* util.ts
 * Misc utility functions.
 *
 * Copyright 2022 David Atkinson <david47k@d47.co>
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

export function arrayEqual(a: any, b: any): boolean {
    if(Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((v, i) => arrayEqual(v,b[i]));
	} else {
		return a === b;
	}
}

export function setAriaPressed(target: EventTarget, active: boolean) {
    if(target instanceof HTMLButtonElement) {
        target.setAttribute('aria-pressed', active.toString());
    }
}    

export function setHideClass(element: Element, active: boolean) {
    if(active) {
        element.classList.remove('hide');
    } else {
        element.classList.add('hide');
    }    
}    
