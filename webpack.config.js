const webpack = require('webpack')
const path = require('path')
const precss = require('precss')
const csso = require('postcss-csso')
const autoprefixer = require('autoprefixer')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const chokidar = require('chokidar')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')

let CONF = {
  entry: {
    main: path.join(__dirname, 'src/index.js'),
  },
  src: path.join(__dirname, 'src'),
  dist: path.join(__dirname, 'public'),
  copy: [
    {
      from: 'favicon/favicon.ico',
      to: '',
      type: 'file'
    },
  ]
}

module.exports = (_ = {}, argv) => {
  const isDEV =
    process.env.NODE_ENV === 'development' || argv.mode === 'development'

  const config = {
    mode: isDEV ? 'development' : 'production',
    devtool: isDEV ? 'inline-cheap-source-map' : 'none',
    context: CONF.src,
    entry: CONF.entry,
    output: {
      path: CONF.dist,
      filename: isDEV ? '[name].js' : '[name].[chunkhash].js'
    },
    watch: isDEV,
    devServer: {
      host: '0.0.0.0',
      port: 9090,
      overlay: true,
      before(app, server) {
        chokidar.watch(CONF.html, {}).on('all', () => {
          server.sockWrite(server.sockets, 'content-changed')
        })
      }
    },
    resolve: {
      extensions: ['.js', '.json'],
      modules: [path.join(__dirname, 'node_modules'), CONF.src]
    },
    optimization: {
      minimize: !isDEV,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            ecma: 6
          }
        })
      ]
    },
    plugins: (() => {
      const common = [
        new webpack.NamedModulesPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new CopyWebpackPlugin(CONF.copy),
        new HtmlWebpackPlugin({
          template: 'index.html',
          inject: 'head',
          minify: !isDEV
        })
      ]

      const production = [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
          path: CONF.dist,
          filename: isDEV ? '[name].css' : '[name].[contenthash].css',
          chunkFilename: isDEV
            ? '[name].[id].css'
            : '[name].[id].[contenthash].css'
        })
      ]

      const development = []

      return isDEV ? common.concat(development) : common.concat(production)
    })(),

    module: {
      rules: [
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader',
              options: {
                minimize: !isDEV
              }
            },
          ]
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          query: {
            cacheDirectory: true
          }
        },
        {
          test: /\.css$/,
          use: [
            isDEV ? 'style-loader' : MiniCssExtractPlugin.loader,
            `css-loader?sourceMap=${isDEV}`,
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: isDEV,
                plugins() {
                  return [
                    csso,
                    autoprefixer,
                    precss,
                  ]
                }
              }
            },
          ]
        },
      ]
    }
  }

  return config
}