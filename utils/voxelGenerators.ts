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

        // Legs
        for(let y=0; y<4; y++) {
            setBlock(map, CX-1.5, Y_START+y, CZ, COLORS.SKIN);
            setBlock(map, CX+1.5, Y_START+y, CZ, COLORS.SKIN);
        }
        // Shoes/Feet
        setBlock(map, CX-1.5, Y_START, CZ+1, COLORS.SKIN);
        setBlock(map, CX+1.5, Y_START, CZ+1, COLORS.SKIN);

        // Dress (Red)
        for(let y=4; y<12; y++) {
            const width = 3.5 - (y-4)*0.15;
            generateSphere(map, CX, Y_START+y, CZ, width, COLORS.RED, 0.8);
        }

        // Arms (Skin)
        for(let y=8; y<11; y++) setBlock(map, CX-3.5, Y_START+y, CZ, COLORS.SKIN);
        // Right Arm (holding Sansão up)
        for(let y=9; y<12; y++) setBlock(map, CX+3.5, Y_START+y, CZ+1.5, COLORS.SKIN);

        // Sansão (Blue Bunny) held in Right Hand
        const SX = CX+5, SY = Y_START+10, SZ = CZ+2;
        // Body of bunny
        for(let i=0; i<3; i++) setBlock(map, SX, SY-i, SZ, COLORS.BLUE_SANS);
        // Ears of bunny
        setBlock(map, SX, SY-3, SZ-1, COLORS.BLUE_SANS);
        setBlock(map, SX, SY-3, SZ+1, COLORS.BLUE_SANS);
        setBlock(map, SX, SY-4, SZ-1, COLORS.BLUE_SANS);
        setBlock(map, SX, SY-4, SZ+1, COLORS.BLUE_SANS);

        // Head (Large, Skin)
        const HY = Y_START + 14;
        generateSphere(map, CX, HY, CZ, 3.8, COLORS.SKIN);

        // Hair (Banana shape)
        generateSphere(map, CX, HY+3, CZ, 3.5, COLORS.HAIR, 0.6);
        // Hair bangs
        setBlock(map, CX-3, HY+1, CZ, COLORS.HAIR);
        setBlock(map, CX+3, HY+1, CZ, COLORS.HAIR);
        setBlock(map, CX-2.5, HY+2, CZ+2, COLORS.HAIR);
        setBlock(map, CX+2.5, HY+2, CZ+2, COLORS.HAIR);

        // Face
        const FACE_Z = CZ + 3.2;
        setBlock(map, CX-1, HY+0.5, FACE_Z, COLORS.BLACK);
        setBlock(map, CX+1, HY+0.5, FACE_Z, COLORS.BLACK);
        // Teeth
        setBlock(map, CX-0.5, HY-1.5, FACE_Z, COLORS.TEETH);
        setBlock(map, CX+0.5, HY-1.5, FACE_Z, COLORS.TEETH);
        setBlock(map, CX-0.5, HY-2.5, FACE_Z, COLORS.TEETH);
        setBlock(map, CX+0.5, HY-2.5, FACE_Z, COLORS.TEETH);

        return Array.from(map.values());
    },

    Cebolinha: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const CX = 0, CZ = 0;
        const Y_START = CONFIG.FLOOR_Y;

        // Legs
        for(let y=0; y<4; y++) {
            setBlock(map, CX-1.5, Y_START+y, CZ, COLORS.SKIN);
            setBlock(map, CX+1.5, Y_START+y, CZ, COLORS.SKIN);
        }
        // Shoes
        setBlock(map, CX-1.5, Y_START, CZ+1, COLORS.DARK);
        setBlock(map, CX+1.5, Y_START, CZ+1, COLORS.DARK);

        // Shorts (Black)
        for(let y=4; y<7; y++) {
            generateSphere(map, CX, Y_START+y, CZ, 3.2, COLORS.CEBOLINHA_SHORTS, 0.8);
        }

        // Shirt (Green)
        for(let y=7; y<12; y++) {
            generateSphere(map, CX, Y_START+y, CZ, 3.3, COLORS.CEBOLINHA_GREEN, 0.8);
        }

        // Arms (Skin)
        for(let y=7; y<10; y++) {
            setBlock(map, CX-3.5, Y_START+y, CZ, COLORS.SKIN); // Left
            setBlock(map, CX+3.5, Y_START+y, CZ, COLORS.SKIN); // Right
        }

        // Head (Large, Skin)
        const HY = Y_START + 14;
        generateSphere(map, CX, HY, CZ, 3.8, COLORS.SKIN);

        // Hair (5 strands)
        const hairY = HY + 3.5;
        // Central hair
        for(let i=0; i<3; i++) setBlock(map, CX, hairY+i, CZ, COLORS.HAIR);
        // Side/Back hairs
        for(let i=0; i<2; i++) setBlock(map, CX-2, hairY+i-0.5, CZ, COLORS.HAIR);
        for(let i=0; i<2; i++) setBlock(map, CX+2, hairY+i-0.5, CZ, COLORS.HAIR);
        for(let i=0; i<2; i++) setBlock(map, CX, hairY+i-0.5, CZ-2, COLORS.HAIR);
        for(let i=0; i<2; i++) setBlock(map, CX, hairY+i+0.5, CZ+1, COLORS.HAIR);


        // Face
        const FACE_Z = CZ + 3.2;
        setBlock(map, CX-1, HY+0.5, FACE_Z, COLORS.BLACK);
        setBlock(map, CX+1, HY+0.5, FACE_Z, COLORS.BLACK);

        return Array.from(map.values());
    },

    Magali: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const CX = 0, CZ = 0;
        const Y_START = CONFIG.FLOOR_Y;

        // Legs
        for(let y=0; y<4; y++) {
            setBlock(map, CX-1.5, Y_START+y, CZ, COLORS.SKIN);
            setBlock(map, CX+1.5, Y_START+y, CZ, COLORS.SKIN);
        }
        setBlock(map, CX-1.5, Y_START, CZ+1, COLORS.SKIN);
        setBlock(map, CX+1.5, Y_START, CZ+1, COLORS.SKIN);

        // Dress (Yellow)
        for(let y=4; y<12; y++) {
            const width = 3.5 - (y-4)*0.15;
            generateSphere(map, CX, Y_START+y, CZ, width, COLORS.MAGALI_YELLOW, 0.8);
        }

        // Arms
        for(let y=8; y<11; y++) setBlock(map, CX-3.5, Y_START+y, CZ, COLORS.SKIN);
        
        // Right Arm (Holding Watermelon)
        for(let y=8; y<10; y++) setBlock(map, CX+3, Y_START+y, CZ+2, COLORS.SKIN);

        // Watermelon Slice
        const WX = CX+2, WY = Y_START+10, WZ = CZ+3;
        for(let x=-2; x<=2; x++) {
            for(let y=0; y<=2; y++) {
                if(x*x + y*y <= 4) {
                    setBlock(map, WX+x, WY+y, WZ, COLORS.WATERMELON_FLESH);
                    // Rind at bottom
                    if (y===0) setBlock(map, WX+x, WY-1, WZ, COLORS.WATERMELON_RIND);
                }
            }
        }
        // Seeds
        setBlock(map, WX-1, WY+1, WZ+0.5, COLORS.BLACK);
        setBlock(map, WX+1, WY+1, WZ+0.5, COLORS.BLACK);

        // Head
        const HY = Y_START + 14;
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
        const CX = 0, CZ = 0;
        const Y_START = CONFIG.FLOOR_Y;

        // Legs
        for(let y=0; y<4; y++) {
            setBlock(map, CX-1.5, Y_START+y, CZ, COLORS.SKIN);
            setBlock(map, CX+1.5, Y_START+y, CZ, COLORS.SKIN);
        }
        setBlock(map, CX-1.5, Y_START, CZ+1, COLORS.DARK);
        setBlock(map, CX+1.5, Y_START, CZ+1, COLORS.DARK);

        // Shorts (Red)
        for(let y=4; y<7; y++) {
            generateSphere(map, CX, Y_START+y, CZ, 3.2, COLORS.RED, 0.8);
        }

        // Shirt (Yellow/Orange)
        for(let y=7; y<12; y++) {
            generateSphere(map, CX, Y_START+y, CZ, 3.3, COLORS.CASCAO_SHIRT, 0.8);
        }

        // Arms
        for(let y=7; y<10; y++) {
            setBlock(map, CX-3.5, Y_START+y, CZ, COLORS.SKIN);
            setBlock(map, CX+3.5, Y_START+y, CZ, COLORS.SKIN);
        }

        // Head
        const HY = Y_START + 14;
        generateSphere(map, CX, HY, CZ, 3.8, COLORS.SKIN);

        // Messy Hair (Black + dirt?)
        generateSphere(map, CX, HY+3.5, CZ, 2.5, COLORS.HAIR);
        // Random messy bits
        setBlock(map, CX-2, HY+3, CZ, COLORS.HAIR);
        setBlock(map, CX+2, HY+4, CZ, COLORS.HAIR);
        setBlock(map, CX, HY+5, CZ, COLORS.HAIR);

        // Face
        const FACE_Z = CZ + 3.2;
        setBlock(map, CX-1, HY+0.5, FACE_Z, COLORS.BLACK);
        setBlock(map, CX+1, HY+0.5, FACE_Z, COLORS.BLACK);
        
        // Dirt smudges on cheeks
        setBlock(map, CX-2, HY-1, FACE_Z-0.5, COLORS.CASCAO_DIRT);
        setBlock(map, CX+2, HY-1, FACE_Z-0.5, COLORS.CASCAO_DIRT);

        // Umbrella (Simple) held in left hand
        const UX = CX-5, UY = Y_START+12, UZ = CZ;
        // Handle
        for(let y=-4; y<2; y++) setBlock(map, UX, UY+y, UZ, COLORS.BLACK);
        // Canopy
        generateSphere(map, UX, UY+2, UZ, 3.5, COLORS.UMBRELLA_GREY, 0.5);

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