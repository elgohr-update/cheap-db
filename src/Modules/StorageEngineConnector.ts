import * as path from 'path';
import * as _ from 'lodash';
import { BaseServiceModule } from "service-starter";
import requireDir = require('require-dir');

import { BaseStorageEngineConnection, BaseStorageEnginePlugin } from "../StorageEnginePlugins/BaseStorageEnginePlugin";

/**
 * 建立与存储引擎的连接
 */
export class StorageEngineConnector extends BaseServiceModule {

    //所有被加载的存储插件
    private _storageEnginePlugins: { [name: string]: BaseStorageEnginePlugin } = {};

    //存储引擎连接
    private _storageEngineConnection: BaseStorageEngineConnection;

    get connection() { return this._storageEngineConnection }

    async onStart(): Promise<void> {
        _.forEach(requireDir(path.join(__dirname, '../StorageEnginePlugins')), item => {
            if ('function' === typeof item) {
                const plugin: BaseStorageEnginePlugin = new item;
                this._storageEnginePlugins[plugin.name] = plugin;
            }
        });

        if (!process.env.STORAGE)
            throw new Error('没有设置存储引擎 [环境变量 STORAGE]');
        else if (!(process.env.STORAGE in this._storageEnginePlugins))
            throw new Error(`没有找到指定的存储引擎。[环境变量 STORAGE：${process.env.STORAGE}]`);
        else
            this._storageEngineConnection = await this._storageEnginePlugins[process.env.STORAGE].getConnection(process.env.DBNAME as any /* MongoConnector 中已经检查过了 */);
    }

    onStop(): Promise<void> {
        return this.connection.disconnect();
    }

    onHealthCheck(): Promise<void> {
        return this.connection.checkConnection();
    }
}