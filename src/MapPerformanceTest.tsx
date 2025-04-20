import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
//import 'maplibre-gl/dist/maplibre-gl.css';

// 東京中心座標 ([lng, lat] 順)
const TOKYO_CENTER: [number, number] = [139.767125, 35.681236];
// 表示する点の数
const POINT_COUNT = 10000;
// 更新間隔（ミリ秒）
const UPDATE_INTERVAL = 100;
// レンダリング間引き (mod)
const RENDER_MOD = 1;

interface MovingPoint {
  speed: number;        // 移動速度（m/interval）
  heading: number;      // 進行方向（ラジアン）
}

// 緯度1mあたりの度
const degPerMeterLat = 1 / 111000;
// 経度1mあたりの度（緯度による補正）
const degPerMeterLon = (lat: number) => 1 / (111000 * Math.cos(lat * Math.PI / 180));

export default function MapPerformanceTest() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pointsRef = useRef<MovingPoint[]>([]);
  const featureCollectionRef = useRef<GeoJSON.FeatureCollection<GeoJSON.Point>>({
    type: 'FeatureCollection',
    features: []
  });

  useEffect(() => {
    if (mapRef.current) return;

    // MapLibre 地図初期化
    const map = new maplibregl.Map({
      container: "map",
      style: 'https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/std.json',
      //style: 'https://demotiles.maplibre.org/style.json',
      center: TOKYO_CENTER,
      zoom: 15,
      maxZoom: 17,
    });
    mapRef.current = map;

    // ランダムな点の生成
    const points: MovingPoint[] = [];
    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

    for (let i = 0; i < POINT_COUNT; i++) {
      // 東京中心から最大0.005度（約550m）以内にランダム配置
      const lat = TOKYO_CENTER[1] + (Math.random() - 0.5) * 0.01;
      const lng = TOKYO_CENTER[0] + (Math.random() - 0.5) * 0.01;

      features.push({
        id: `id${i}`,
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {}
      });

      // 初速度と向き
      const speed = 1 + Math.random() * 9; // 1〜10 m/interval
      const heading = Math.random() * 2 * Math.PI;

      points.push({ speed, heading });
    }

    featureCollectionRef.current = {
      type: 'FeatureCollection',
      features
    };
    pointsRef.current = points;

    // ソースとレイヤーの追加
    map.on('load', () => {
      map.addSource('points', {
        type: 'geojson',
        data: featureCollectionRef.current
      });

      map.addLayer({
        id: 'points-layer',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-radius': 4,
          'circle-color': 'red'
        }
      });
    });

    // アニメーションループ
    let prevFrameTime = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const intervalTime = now - prevFrameTime;
      prevFrameTime = now;
      let totalCalc = 0;
      let counter = 0;

      const fc = featureCollectionRef.current;
      fc.features.forEach((feature, idx) => {
        const startCalc = performance.now();
        const [lng, lat] = feature.geometry.coordinates;

        // メートル→度換算
        const dLat = pointsRef.current[idx].speed * degPerMeterLat * Math.cos(pointsRef.current[idx].heading);
        const dLng = pointsRef.current[idx].speed * degPerMeterLon(lat) * Math.sin(pointsRef.current[idx].heading);
        let newLat = lat + dLat;
        let newLng = lng + dLng;

        // 範囲外なら東京中心にリセット
        if (Math.abs(newLat - TOKYO_CENTER[1]) > 0.02 || Math.abs(newLng - TOKYO_CENTER[0]) > 0.02) {
          newLat = TOKYO_CENTER[1];
          newLng = TOKYO_CENTER[0];
        }

        // ランダムで向きをわずかに変える
        const directionFactor = (Math.random() - 0.5) * 0.2;
        pointsRef.current[idx].heading += directionFactor;

        const endCalc = performance.now();
        totalCalc += endCalc - startCalc;

        // レンダリング間引き
        if ((counter++ % RENDER_MOD) === 0) {
          feature.geometry.coordinates = [newLng, newLat];
        }
      });

      // データ更新
      const source = map.getSource('points') as maplibregl.GeoJSONSource;
      source.setData(fc);

      const renderTime = intervalTime - UPDATE_INTERVAL - totalCalc;
      console.info(`MapLibre render time: render=${renderTime}, totalCalc=${totalCalc}`);
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(timer);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div id="map" style={{ width: "100%", height: "100vh" }} />;
}
