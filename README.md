# leaflet test

* Intel Core i9-12900KS / GeForce RTX 3090 / Ubuntu 22.04LTS / Firefox 137.0.2 (64-bit)
* 計算時間は大体1ms/10000pointsを超えるぐらいなので、100000pointsでもそれほど負荷に影響はない。

## 10000points

* `UPDATE_INTERVAL=100`, `RENDER_MOD=1`: 問題ない。レンダリング遅延なし。計算時間は<=1ms
  ![test10000.png](images/test10000.png)

## 50000points

* `UPDATE_INTERVAL=100`, `RENDER_MOD=1`: 遅くなった。レンダリングは350msぐらい。計算時間は≈7ms
  ![test50000_1.png](images/test50000_1.png)
* `UPDATE_INTERVAL=100`, `RENDER_MOD=1`: 拡大すると多少速くなる。レンダリングは160msぐらい。計算時間は≈7ms
  ![test50000_2.png](images/test50000_2.png)
* `UPDATE_INTERVAL=100`, `RENDER_MOD=2`: 間引きすると多少速くなる。レンダリングは200msぐらい。計算時間は≈7ms
  ![test50000_3.png](images/test50000_3.png)

## 100000points

* `UPDATE_INTERVAL=100`, `RENDER_MOD=1`: 遅い。レンダリングは850msぐらい。計算時間は≈13ms
  ![test100000_1.png](images/test100000_1.png)
* `UPDATE_INTERVAL=100`, `RENDER_MOD=1`: 拡大すると多少速くなる。レンダリングは380msぐらい。計算時間は≈13ms
  ![test100000_2.png](images/test100000_2.png)
* `UPDATE_INTERVAL=100`, `RENDER_MOD=2`: 間引きすると多少速くなる。レンダリングは500msぐらい。計算時間は≈13ms
  ![test100000_3.png](images/test100000_3.png)

# License

CC0
