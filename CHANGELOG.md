# Changelog

## [0.1.1](https://github.com/pwnthemall/pwnthemall/compare/v0.1.0...v0.1.1) (2025-11-27)


### 🐛 Fixes

* docker-compose.prod.yml & docker-compose.demo.yml new version ([b2c9071](https://github.com/pwnthemall/pwnthemall/commit/b2c90715bf143eb7d53a415c35365088ac248114))
* docker-compose.prod.yml & docker-compose.demo.yml new version ([83beb9b](https://github.com/pwnthemall/pwnthemall/commit/83beb9bdf1ed9b4261d0828e9b3b9129775fbd61))
* missing permissions for member on new challenge routes ([d4799d7](https://github.com/pwnthemall/pwnthemall/commit/d4799d7c9f04a015b54ea472b6898479292cac99))
* missing permissions for member on new challenge routes ([837aa8b](https://github.com/pwnthemall/pwnthemall/commit/837aa8b5d709f069c447296de1f084d8fedef4c7))
* release please config update ([743c9c3](https://github.com/pwnthemall/pwnthemall/commit/743c9c31bfe84e6f421e5e12e46b7fab2f6badd4))
* release please config update ([66faf48](https://github.com/pwnthemall/pwnthemall/commit/66faf4896aa46d188d7ddddc2dccd20ceadc571f))
* wrong release please config ([9cc98ef](https://github.com/pwnthemall/pwnthemall/commit/9cc98ef5d0e30c0e7de331d4892e704e8f63aa20))
* wrong release please config ([bdcdc1b](https://github.com/pwnthemall/pwnthemall/commit/bdcdc1b22fb0da5997a3eda1fbd33b8efb6a0e0f))

## [0.1.0](https://github.com/pwnthemall/pwnthemall/compare/0.0.2...v0.1.0) (2025-11-26)


### Features

* added depends_on tag in the yml. Challenge visibility can now depends on the flagging of another challenge ([6631189](https://github.com/pwnthemall/pwnthemall/commit/663118928d208c0935975ff36ebded9fc1721eb0))
* added selection to instance management and stop all or selected instance ([8ffd876](https://github.com/pwnthemall/pwnthemall/commit/8ffd87670a3f2ee583dfd6686834ee3245f90872))
* **admin:** add instances management page with filtering, searching and actions ([7c2e428](https://github.com/pwnthemall/pwnthemall/commit/7c2e428678dde75159c7a81a260826e71ed5e622))
* **admin:** add running docker challenges module to dashboard ([d212910](https://github.com/pwnthemall/pwnthemall/commit/d212910950604aff418852af74839594c5c5cf14))
* docker network isolations + agent privileged container ([ba6f42b](https://github.com/pwnthemall/pwnthemall/commit/ba6f42bd46cfc7583fbb15b0dfd9573e567737cd))
* docker network isolations + agent privileged container ([49ea455](https://github.com/pwnthemall/pwnthemall/commit/49ea45546e373e73db1c866412a561d3af333e09))
* Implemented/Fixed no decay, multiple logarithmic decay presets. Also made points update according to the decay ( in solves tab, profile, leaderboard etc) ([40c1eb5](https://github.com/pwnthemall/pwnthemall/commit/40c1eb5a35a1ac0bb614ba8d234488fe6ed8a68c))
* multiple things ([4ce9285](https://github.com/pwnthemall/pwnthemall/commit/4ce9285a81be8255dbddd988ac7fdd7cd063a3e3))
* You can now add attachments your challenges ([2594eab](https://github.com/pwnthemall/pwnthemall/commit/2594eabb732e2a4af51e029c14d03c89060925a2))
* You can now add covers to the challenge cards ([321c849](https://github.com/pwnthemall/pwnthemall/commit/321c849a1e943c25af5535cc8a35dd1ea7ff6dbc))


### Bug Fixes

* adding middleware for challenge cover route ([4f5da8b](https://github.com/pwnthemall/pwnthemall/commit/4f5da8bec521ae3fd3f49960fc3cbe8dc57888bc))
* admin dashboard routes ([c9db272](https://github.com/pwnthemall/pwnthemall/commit/c9db27294ab79186316a2d27753d0940d0a0ee40))
* async compose stop ([7aff9f4](https://github.com/pwnthemall/pwnthemall/commit/7aff9f44700722c83613b20f6d58d6fa630c83e7))
* backend entrypoints script + cookies page ([80b8306](https://github.com/pwnthemall/pwnthemall/commit/80b83069015672f2956ba0f6ff514c7a65863ae3))
* **challenges:** real challenges added; fake challenges removed ([97fd620](https://github.com/pwnthemall/pwnthemall/commit/97fd6203c5285a784ed0088d4a339c892a4eedb4))
* **challenges:** real challenges added; fake challenges removed ([0d2843c](https://github.com/pwnthemall/pwnthemall/commit/0d2843ca09733da3df59dbfba8861fb99274b747))
* compose challenge not stopping correctly, now uses websocket ([106cdde](https://github.com/pwnthemall/pwnthemall/commit/106cdde5b5b090cb63a8053c27d963d3adeb955a))
* containerName + fixed dashboard recent activity module not being loaded correctly ([8a5e616](https://github.com/pwnthemall/pwnthemall/commit/8a5e6160eb139dc5c0009d6dc152fb34a3a1d000))
* **docker:** network isolation working (INPUT iptables) ([d065d5d](https://github.com/pwnthemall/pwnthemall/commit/d065d5dcf080646a2b4e097982cb6f83ee993e3f))
* FileMetadata moved from controller to meta package + chall b64mystery updated to fr ([ed068d3](https://github.com/pwnthemall/pwnthemall/commit/ed068d3b3afa51cbbf0a66da2cbd7a4b9e2ffb25))
* Final fix ( i hope ) for the network change error ([d10a99d](https://github.com/pwnthemall/pwnthemall/commit/d10a99d6e0090cc42b85914e9f72d2d812060ffb))
* Final fix ( i hope ) for the network change error ([9373d08](https://github.com/pwnthemall/pwnthemall/commit/9373d08cc692bceb5495fbb0939650c2f047ef0b))
* frontend compilation for prod env ([0093310](https://github.com/pwnthemall/pwnthemall/commit/0093310efaea9918962dcaa624f9c60cce533c3c))
* isolation; compose profiles; pta-cli.sh; .env; frontend theme ([861e41c](https://github.com/pwnthemall/pwnthemall/commit/861e41c833ef7f5912ba13c1ba3e56fa8e5dd778))
* libvirt worker image ([a604afe](https://github.com/pwnthemall/pwnthemall/commit/a604afefdee496ef1fb7941890911a55e353a049))
* playwright new version ([8460b93](https://github.com/pwnthemall/pwnthemall/commit/8460b93a3c282a3d478a75ee29807d9f1eea3943))
* rate-limite added to stop all ([f191c86](https://github.com/pwnthemall/pwnthemall/commit/f191c861a8f030d08c4b742d3c49b88cd0513e59))
* refresh after stopping all instances ([a14576c](https://github.com/pwnthemall/pwnthemall/commit/a14576c349d1a41c5fa45bc8e4aa1c785c874c6e))
* remove duplicate DB.Create() call in compose instance creation ([3322f5d](https://github.com/pwnthemall/pwnthemall/commit/3322f5dc907a2efc93fb0126fa71b889cb6f9bf3))
* stopping now deletes from db AND stops the instance ( was only doing the db part before ) ([88ac12f](https://github.com/pwnthemall/pwnthemall/commit/88ac12f1b4ec1491729adb9d9acaf291340a1176))
* table height when page isnt filled ([eb5f4a8](https://github.com/pwnthemall/pwnthemall/commit/eb5f4a8fa5ace662b6a15ccc13ce2ec972b07952))
* users management bug in firefox ([c331b39](https://github.com/pwnthemall/pwnthemall/commit/c331b3971545d85aa71de56bebcb8ee9a6ec3e7c))
