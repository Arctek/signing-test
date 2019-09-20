/**
 * This is to generate the umd bundle only
 */
const _ = require('lodash');
const webpack = require('webpack');
const path = require('path');
const production = true;//process.env.NODE_ENV === 'production';
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

let entry = {
    'lib': './index.ts',
};
if (production) {
    entry = _.assign({}, entry, {'lib.min': './index.ts'});
}

module.exports = {
    entry,
    output: {
        path: path.resolve(__dirname),
        filename: '[name].js',
        libraryTarget: 'umd',
        //library: 'ZeroEx',
        umdNamedDefine: true,
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    },
    //devtool: 'source-map',
    plugins: [
        /*new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            sourceMap: true,
            include: /\.min\.js$/,
        })*///,
        new UglifyJSPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        //loader: 'awesome-typescript-loader',
                        loader: "awesome-typescript-loader",
                        /*query: {
                            declaration: false,
                        },*/
                        options: {
                            configFileName: "tsconfig.webpack.json"
                        }
                    },
                ],
                exclude: /node_modules/,
            },
            /*{
                test: /\.json$/,
                loader: 'json-loader',
            },*/
            /*{
                test: /\.js$/,
                loader: 'babel-loader'
                //exclude: /node_modules/
            }*/
        ],
    },
};
