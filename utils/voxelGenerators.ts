/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { VoxelData } from '../types';
import { COLORS, CONFIG } from './voxelConstants';

// Helper to prevent overlapping voxels
function setBlock(map: Map<string, VoxelData>, x: number, y: number, z: number, color: number) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);
    const key = `${rx},${ry},${rz}`;
    map.set(key, { x: rx, y: ry, z: rz, color });
}

function fillBox(map: Map<string, VoxelData>, x1: number, x2: number, y1: number, y2: number, z1: number, z2: number, color: number) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
                setBlock(map, x, y, z, color);
            }
        }
    }
}

function generateSphere(map: Map<string, VoxelData>, cx: number, cy: number, cz: number, r: number, col: number, sy = 1) {
    const r2 = r * r;
    const xMin = Math.floor(cx - r);
    const xMax = Math.ceil(cx + r);
    const yMin = Math.floor(cy - r * sy);
    const yMax = Math.ceil(cy + r * sy);
    const zMin = Math.floor(cz - r);
    const zMax = Math.ceil(cz + r);

    for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
            for (let z = zMin; z <= zMax; z++) {
                const dx = x - cx;
                const dy = (y - cy) / sy;
                const dz = z - cz;
                if (dx * dx + dy * dy + dz * dz <= r2) {
                    setBlock(map, x, y, z, col);
                }
            }
        }
    }
}

export const Generators = {
    Monica: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const CX = 0, CZ = 0;
        const Y_START = CONFIG.FLOOR_Y;

        // Legs (Detached)
        // Moved down to leave a gap or just kept low
        for(let y=0; y<4; y++) {
            setBlock(map, CX-1.5, Y_START+y, CZ, COLORS.SKIN);
            setBlock(map, CX+1.5, Y_START+y, CZ, COLORS.SKIN);
        }
        // Shoes/Feet
        setBlock(map, CX-1.5, Y_START, CZ+1, COLORS.SKIN);
        setBlock(map, CX+1.5, Y_START, CZ+1, COLORS.SKIN);

        // Dress (Red) - Starts at Y_START+5 to leave gap for legs
        for(let y=5; y<13; y++) {
            const width = 3.5 - (y-5)*0.15;
            generateSphere(map, CX, Y_START+y, CZ, width, COLORS.RED, 0.8);
        }

        // Arms (Skin) - Moved outward to detach
        // Left Arm
        for(let y=9; y<12; y++) setBlock(map, CX-4.5, Y_START+y, CZ, COLORS.SKIN);
        
        // Right Arm (holding Sansão up)
        for(let y=10; y<13; y++) setBlock(map, CX+4.5, Y_START+y, CZ+1.5, COLORS.SKIN);

        // Sansão (Blue Bunny) held in Right Hand
        const SX = CX+6, SY = Y_START+11, SZ = CZ+2;
        // Body of bunny
        for(let i=0; i<3; i++) setBlock(map, SX, SY-i, SZ, COLORS.BLUE_SANS);
        // Ears of bunny
        setBlock(map, SX, SY-3, SZ-1, COLORS.BLUE_SANS);
        setBlock(map, SX, SY-3, SZ+1, COLORS.BLUE_SANS);

        // Head (Large, Skin)
        const HY = Y_START + 15;
        generateSphere(map, CX, HY, CZ, 3.8, COLORS.SKIN);

        // Hair (Banana shape)
        generateSphere(map, CX, HY+3, CZ, 3.5, COLORS.HAIR, 0.6);
        // Hair bangs
        setBlock(map, CX-3, HY+1, CZ, COLORS.HAIR);
        setBlock(map, CX+3, HY+1, CZ, COLORS.HAIR);

        // Face
        const FACE_Z = CZ + 3.2;
        setBlock(map, CX-1, HY+0.5, FACE_Z, COLORS.BLACK);
        setBlock(map, CX+1, HY+0.5, FACE_Z, COLORS.BLACK);
        // Teeth
        setBlock(map, CX-0.5, HY-1.5, FACE_Z, COLORS.TEETH);
        setBlock(map, CX+0.5, HY-1.5, FACE_Z, COLORS.TEETH);

        return Array.from(map.values());
    },

    Cebolinha: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const Y_START = CONFIG.FLOOR_Y;

        // --- LAYER 1: FEET & LEGS (Detached) ---
        // Blocky Shoes (Brown/Dark)
        fillBox(map, -3, -2, Y_START, Y_START + 1, -2, 2, COLORS.DARK); // Left
        fillBox(map, 2, 3, Y_START, Y_START + 1, -2, 2, COLORS.DARK);   // Right

        // Legs (Skin)
        fillBox(map, -3, -2, Y_START + 2, Y_START + 5, -1, 1, COLORS.SKIN);
        fillBox(map, 2, 3, Y_START + 2, Y_START + 5, -1, 1, COLORS.SKIN);

        // --- LAYER 2: SHORTS (Black) ---
        // Gap of 1 voxel between legs and shorts (Legs end at +5, Shorts start at +7)
        fillBox(map, -3, 3, Y_START + 7, Y_START + 9, -2, 2, COLORS.CEBOLINHA_SHORTS);
        // Shorts leg connectors (Visual only, still separate from legs)
        fillBox(map, -3, -2, Y_START + 6, Y_START + 6, -2, 2, COLORS.CEBOLINHA_SHORTS);
        fillBox(map, 2, 3, Y_START + 6, Y_START + 6, -2, 2, COLORS.CEBOLINHA_SHORTS);

        // --- LAYER 3: TORSO (Green Shirt) ---
        const WAIST_Y = Y_START + 10;
        const NECK_Y = WAIST_Y + 5;
        // Main body
        fillBox(map, -3, 3, WAIST_Y, NECK_Y, -2, 2, COLORS.CEBOLINHA_GREEN);
        
        // --- LAYER 4: ARMS (Detached) ---
        // Sleeves (Green) - Gap at X=-4 and X=4
        fillBox(map, -6, -5, WAIST_Y + 3, WAIST_Y + 5, -1, 1, COLORS.CEBOLINHA_GREEN); // Left
        fillBox(map, 5, 6, WAIST_Y + 3, WAIST_Y + 5, -1, 1, COLORS.CEBOLINHA_GREEN);  // Right
        
        // Skin Arms
        fillBox(map, -6, -5, WAIST_Y - 1, WAIST_Y + 2, -1, 1, COLORS.SKIN); // Left
        fillBox(map, 5, 6, WAIST_Y + 1, WAIST_Y + 2, 2, 4, COLORS.SKIN); // Right (Pointing)
        fillBox(map, 5.5, 6.5, WAIST_Y + 1, WAIST_Y + 1, 5, 5, COLORS.SKIN); // Finger tip

        // --- LAYER 5: HEAD ---
        const HEAD_Y = NECK_Y + 1;
        // Head Block
        const HEAD_H = 7;
        fillBox(map, -4, 4, HEAD_Y, HEAD_Y + HEAD_H, -3, 3, COLORS.SKIN);

        // Face
        const FACE_Z = 3;
        setBlock(map, -2, HEAD_Y + 4, FACE_Z + 1, COLORS.BLACK);
        setBlock(map, 2, HEAD_Y + 4, FACE_Z + 1, COLORS.BLACK);
        setBlock(map, -1, HEAD_Y + 6, FACE_Z + 1, COLORS.BLACK);
        setBlock(map, 1, HEAD_Y + 6, FACE_Z + 1, COLORS.BLACK);
        fillBox(map, -1, 1, HEAD_Y + 2, HEAD_Y + 2, FACE_Z + 1, FACE_Z + 1, COLORS.BLACK);

        // 5 Hairs
        const HAIR_BASE_Y = HEAD_Y + HEAD_H;
        fillBox(map, -0.5, 0.5, HAIR_BASE_Y + 1, HAIR_BASE_Y + 5, 0, 0, COLORS.HAIR);
        fillBox(map, -2.5, -2.5, HAIR_BASE_Y + 1, HAIR_BASE_Y + 4, 1, 1, COLORS.HAIR);
        fillBox(map, 2.5, 2.5, HAIR_BASE_Y + 1, HAIR_BASE_Y + 4, 1, 1, COLORS.HAIR);
        fillBox(map, -2, -2, HAIR_BASE_Y + 1, HAIR_BASE_Y + 3, -2, -2, COLORS.HAIR);
        fillBox(map, 2, 2, HAIR_BASE_Y + 1, HAIR_BASE_Y + 3, -2, -2, COLORS.HAIR);

        return Array.from(map.values());
    },

    Magali: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const CX = 0, CZ = 0;
        const Y_START = CONFIG.FLOOR_Y;

        // Legs (Detached)
        for(let y=0; y<4; y++) {
            setBlock(map, CX-1.5, Y_START+y, CZ, COLORS.SKIN);
            setBlock(map, CX+1.5, Y_START+y, CZ, COLORS.SKIN);
        }
        setBlock(map, CX-1.5, Y_START, CZ+1, COLORS.SKIN);
        setBlock(map, CX+1.5, Y_START, CZ+1, COLORS.SKIN);

        // Dress (Yellow) - Gap from legs
        for(let y=5; y<13; y++) {
            const width = 3.5 - (y-5)*0.15;
            generateSphere(map, CX, Y_START+y, CZ, width, COLORS.MAGALI_YELLOW, 0.8);
        }

        // Arms (Detached)
        for(let y=9; y<12; y++) setBlock(map, CX-4.5, Y_START+y, CZ, COLORS.SKIN); // Left
        for(let y=9; y<11; y++) setBlock(map, CX+4.5, Y_START+y, CZ+2, COLORS.SKIN); // Right

        // Watermelon
        const WX = CX+3.5, WY = Y_START+11, WZ = CZ+3;
        for(let x=-2; x<=2; x++) {
            for(let y=0; y<=2; y++) {
                if(x*x + y*y <= 4) {
                    setBlock(map, WX+x, WY+y, WZ, COLORS.WATERMELON_FLESH);
                    if (y===0) setBlock(map, WX+x, WY-1, WZ, COLORS.WATERMELON_RIND);
                }
            }
        }
        setBlock(map, WX-1, WY+1, WZ+0.5, COLORS.BLACK);
        setBlock(map, WX+1, WY+1, WZ+0.5, COLORS.BLACK);

        // Head
        const HY = Y_START + 15;
        generateSphere(map, CX, HY, CZ, 3.8, COLORS.SKIN);

        // Hair
        generateSphere(map, CX, HY+3, CZ, 3.5, COLORS.HAIR, 0.6);
        setBlock(map, CX-3, HY+1, CZ, COLORS.HAIR);
        setBlock(map, CX+3, HY+1, CZ, COLORS.HAIR);

        // Face
        const FACE_Z = CZ + 3.2;
        setBlock(map, CX-1, HY+0.5, FACE_Z, COLORS.BLACK);
        setBlock(map, CX+1, HY+0.5, FACE_Z, COLORS.BLACK);

        return Array.from(map.values());
    },

    Cascao: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const Y_START = CONFIG.FLOOR_Y;

        // --- LAYER 1: FEET & LEGS (Detached) ---
        fillBox(map, -3, -2, Y_START, Y_START + 1, -2, 2, COLORS.DARK); 
        fillBox(map, 2, 3, Y_START, Y_START + 1, -2, 2, COLORS.DARK);   

        fillBox(map, -3, -2, Y_START + 2, Y_START + 5, -1, 1, COLORS.SKIN);
        fillBox(map, 2, 3, Y_START + 2, Y_START + 5, -1, 1, COLORS.SKIN);

        // --- LAYER 2: SHORTS (Red) - Gap from legs ---
        fillBox(map, -3, 3, Y_START + 7, Y_START + 9, -2, 2, COLORS.RED);
        fillBox(map, -3, -2, Y_START + 6, Y_START + 6, -2, 2, COLORS.RED);
        fillBox(map, 2, 3, Y_START + 6, Y_START + 6, -2, 2, COLORS.RED);

        // --- LAYER 3: TORSO (Yellow Shirt) ---
        const WAIST_Y = Y_START + 10;
        const NECK_Y = WAIST_Y + 5; 
        fillBox(map, -3, 3, WAIST_Y, NECK_Y, -2, 2, COLORS.CASCAO_SHIRT);

        // --- LAYER 4: ARMS (Detached) ---
        // Sleeves - Gap
        fillBox(map, -6, -5, WAIST_Y + 3, WAIST_Y + 5, -1, 1, COLORS.CASCAO_SHIRT);
        fillBox(map, 5, 6, WAIST_Y + 3, WAIST_Y + 5, -1, 1, COLORS.CASCAO_SHIRT);
        
        // Skin Arms
        fillBox(map, -6, -5, WAIST_Y - 1, WAIST_Y + 2, -1, 1, COLORS.SKIN); 
        fillBox(map, 5, 6, WAIST_Y + 1, WAIST_Y + 2, 2, 3, COLORS.SKIN); 

        // --- LAYER 5: HEAD ---
        const HEAD_Y = NECK_Y + 2;
        const HEAD_H = 7;
        fillBox(map, -4, 4, HEAD_Y, HEAD_Y + HEAD_H, -3, 3, COLORS.SKIN);

        const FACE_Z = 3;
        setBlock(map, -2, HEAD_Y + 4, FACE_Z + 1, COLORS.BLACK);
        setBlock(map, 2, HEAD_Y + 4, FACE_Z + 1, COLORS.BLACK);
        fillBox(map, -2, 2, HEAD_Y + 2, HEAD_Y + 2, FACE_Z + 1, FACE_Z + 1, COLORS.BLACK);
        setBlock(map, -3, HEAD_Y + 2, FACE_Z + 1, COLORS.CASCAO_DIRT);
        setBlock(map, 3, HEAD_Y + 2, FACE_Z + 1, COLORS.CASCAO_DIRT);

        // --- LAYER 6: MESSY HAIR ---
        const HAIR_Y = HEAD_Y + HEAD_H + 1;
        fillBox(map, -4, 4, HAIR_Y, HAIR_Y, -3, 3, COLORS.HAIR);
        for(let x=-4; x<=4; x++) {
            for(let z=-3; z<=3; z++) {
                if((x+z) % 2 !== 0) {
                    setBlock(map, x, HAIR_Y + 1, z, COLORS.HAIR);
                    if(Math.random() > 0.6) setBlock(map, x, HAIR_Y + 2, z, COLORS.HAIR);
                }
            }
        }
        fillBox(map, -4, -4, HEAD_Y + 3, HAIR_Y, -2, 2, COLORS.HAIR); 
        fillBox(map, 4, 4, HEAD_Y + 3, HAIR_Y, -2, 2, COLORS.HAIR); 
        fillBox(map, -3, 3, HEAD_Y + 2, HAIR_Y, -3, -3, COLORS.HAIR); 

        // --- PROP: UMBRELLA ---
        const UX = 6, UY = WAIST_Y + 1, UZ = 3;
        fillBox(map, UX, UX, UY - 3, UY + 6, UZ, UZ, COLORS.BLACK);
        const CY = UY + 6;
        fillBox(map, UX - 3, UX + 3, CY, CY + 1, UZ - 3, UZ + 3, COLORS.UMBRELLA_GREY);
        fillBox(map, UX - 1, UX + 1, CY + 2, CY + 2, UZ - 1, UZ + 1, COLORS.UMBRELLA_GREY);

        return Array.from(map.values());
    },

    Cat: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const CY = CONFIG.FLOOR_Y + 1; const CX = 0, CZ = 0;
        // Paws
        generateSphere(map, CX - 3, CY + 2, CZ, 2.2, COLORS.DARK, 1.2);
        generateSphere(map, CX + 3, CY + 2, CZ, 2.2, COLORS.DARK, 1.2);
        // Body
        for (let y = 0; y < 7; y++) {
            const r = 3.5 - (y * 0.2);
            generateSphere(map, CX, CY + 2 + y, CZ, r, COLORS.DARK);
            generateSphere(map, CX, CY + 2 + y, CZ + 2, r * 0.6, COLORS.WHITE);
        }
        // Legs
        for (let y = 0; y < 5; y++) {
            setBlock(map, CX - 1.5, CY + y, CZ + 3, COLORS.WHITE); setBlock(map, CX + 1.5, CY + y, CZ + 3, COLORS.WHITE);
            setBlock(map, CX - 1.5, CY + y, CZ + 2, COLORS.WHITE); setBlock(map, CX + 1.5, CY + y, CZ + 2, COLORS.WHITE);
        }
        // Head
        const CHY = CY + 9;
        generateSphere(map, CX, CHY, CZ, 3.2, COLORS.LIGHT, 0.8);
        // Ears
        [[-2, 1], [2, 1]].forEach(side => {
            setBlock(map, CX + side[0], CHY + 3, CZ, COLORS.DARK); setBlock(map, CX + side[0] * 0.8, CHY + 3, CZ + 1, COLORS.WHITE);
            setBlock(map, CX + side[0], CHY + 4, CZ, COLORS.DARK);
        });
        // Tail
        for (let i = 0; i < 12; i++) {
            const a = i * 0.3, tx = Math.cos(a) * 4.5, tz = Math.sin(a) * 4.5;
            if (tz > -2) { setBlock(map, CX + tx, CY, CZ + tz, COLORS.DARK); setBlock(map, CX + tx, CY + 1, CZ + tz, COLORS.DARK); }
        }
        // Face
        setBlock(map, CX - 1, CHY + 0.5, CZ + 2.5, COLORS.GOLD); setBlock(map, CX + 1, CHY + 0.5, CZ + 2.5, COLORS.GOLD);
        setBlock(map, CX - 1, CHY + 0.5, CZ + 3, COLORS.BLACK); setBlock(map, CX + 1, CHY + 0.5, CZ + 3, COLORS.BLACK);
        setBlock(map, CX, CHY, CZ + 3, COLORS.TALON);
        return Array.from(map.values());
    },

    Rabbit: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const LOG_Y = CONFIG.FLOOR_Y + 2.5;
        const RX = 0, RZ = 0;
        // Log
        for (let x = -6; x <= 6; x++) {
            const radius = 2.8 + Math.sin(x * 0.5) * 0.2;
            generateSphere(map, x, LOG_Y, 0, radius, COLORS.DARK);
            if (x === -6 || x === 6) generateSphere(map, x, LOG_Y, 0, radius - 0.5, COLORS.WOOD);
            if (Math.random() > 0.8) setBlock(map, x, LOG_Y + radius, (Math.random() - 0.5) * 2, COLORS.GREEN);
        }
        // Body
        const BY = LOG_Y + 2.5;
        generateSphere(map, RX - 1.5, BY + 1.5, RZ - 1.5, 1.8, COLORS.WHITE);
        generateSphere(map, RX + 1.5, BY + 1.5, RZ - 1.5, 1.8, COLORS.WHITE);
        generateSphere(map, RX, BY + 2, RZ, 2.2, COLORS.WHITE, 0.8);
        generateSphere(map, RX, BY + 2.5, RZ + 1.5, 1.5, COLORS.WHITE);
        setBlock(map, RX - 1.2, BY, RZ + 2.2, COLORS.LIGHT); setBlock(map, RX + 1.2, BY, RZ + 2.2, COLORS.LIGHT);
        setBlock(map, RX - 2.2, BY, RZ - 0.5, COLORS.WHITE); setBlock(map, RX + 2.2, BY, RZ - 0.5, COLORS.WHITE);
        generateSphere(map, RX, BY + 1.5, RZ - 2.5, 1.0, COLORS.WHITE);
        // Head
        const HY = BY + 4.5; const HZ = RZ + 1;
        generateSphere(map, RX, HY, HZ, 1.7, COLORS.WHITE);
        generateSphere(map, RX - 1.1, HY - 0.5, HZ + 0.5, 1.0, COLORS.WHITE);
        generateSphere(map, RX + 1.1, HY - 0.5, HZ + 0.5, 1.0, COLORS.WHITE);
        // Ears
        for (let y = 0; y < 5; y++) {
            const curve = y * 0.2;
            setBlock(map, RX - 0.8, HY + 1.5 + y, HZ - curve, COLORS.WHITE); setBlock(map, RX - 1.2, HY + 1.5 + y, HZ - curve, COLORS.WHITE);
            setBlock(map, RX - 1.0, HY + 1.5 + y, HZ - curve + 0.5, COLORS.LIGHT);
            setBlock(map, RX + 0.8, HY + 1.5 + y, HZ - curve, COLORS.WHITE); setBlock(map, RX + 1.2, HY + 1.5 + y, HZ - curve, COLORS.WHITE);
            setBlock(map, RX + 1.0, HY + 1.5 + y, HZ - curve + 0.5, COLORS.LIGHT);
        }
        setBlock(map, RX - 0.8, HY + 0.2, HZ + 1.5, COLORS.BLACK); setBlock(map, RX + 0.8, HY + 0.2, HZ + 1.5, COLORS.BLACK);
        setBlock(map, RX, HY - 0.5, HZ + 1.8, COLORS.TALON);
        return Array.from(map.values());
    }
};
