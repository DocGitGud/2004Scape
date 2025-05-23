import fs from 'fs';


import { ConfigType } from '#/cache/config/ConfigType.js';
import ScriptVarType from '#/cache/config/ScriptVarType.js';
import Packet from '#/io/Packet.js';

export default class EnumType extends ConfigType {
    static configNames = new Map<string, number>();
    static configs: EnumType[] = [];

    static load(dir: string) {
        if (!fs.existsSync(`${dir}/server/enum.dat`)) {
            return;
        }

        const dat = Packet.load(`${dir}/server/enum.dat`);
        this.parse(dat);
    }

    static async loadAsync(dir: string) {
        const file = await fetch(`${dir}/server/enum.dat`);
        if (!file.ok) {
            return;
        }

        const dat = new Packet(new Uint8Array(await file.arrayBuffer()));
        this.parse(dat);
    }

    static parse(dat: Packet) {
        EnumType.configNames = new Map();
        EnumType.configs = [];

        const count = dat.g2();

        for (let id = 0; id < count; id++) {
            const config = new EnumType(id);
            config.decodeType(dat);

            EnumType.configs[id] = config;

            if (config.debugname) {
                EnumType.configNames.set(config.debugname, id);
            }
        }
    }

    static get(id: number): EnumType {
        return EnumType.configs[id];
    }

    static getId(name: string): number {
        return EnumType.configNames.get(name) ?? -1;
    }

    static getByName(name: string): EnumType | null {
        const id = this.getId(name);
        if (id === -1) {
            return null;
        }

        return this.get(id);
    }

    static get count() {
        return this.configs.length;
    }

    // ----
    // server-side
    inputtype = ScriptVarType.INT;
    outputtype = ScriptVarType.INT;
    defaultInt: number = 0;
    defaultString: string = 'null';
    values = new Map<number, number | string>();

    decode(code: number, dat: Packet): void {
        if (code === 1) {
            this.inputtype = dat.g1();
        } else if (code === 2) {
            this.outputtype = dat.g1();
        } else if (code === 3) {
            this.defaultString = dat.gjstr();
        } else if (code === 4) {
            this.defaultInt = dat.g4();
        } else if (code === 5) {
            const count = dat.g2();

            for (let i = 0; i < count; i++) {
                this.values.set(dat.g4(), dat.gjstr());
            }
        } else if (code === 6) {
            const count = dat.g2();

            for (let i = 0; i < count; i++) {
                this.values.set(dat.g4(), dat.g4());
            }
        } else if (code === 250) {
            this.debugname = dat.gjstr();
        } else {
            throw new Error(`Unrecognized enum config code: ${code}`);
        }
    }
}
