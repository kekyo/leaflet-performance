import { useEffect, useRef } from 'react';
import L from 'leaflet';
import './MapPerformanceTest.css';

// 東京中心座標
const TOKYO_CENTER = new L.LatLng(35.681236, 139.767125);
// 表示する点の数
const POINT_COUNT = 1000;
// 更新間隔（ミリ秒）
const UPDATE_INTERVAL = 100;

interface MovingPoint {
  marker: L.CircleMarker;
  // 移動速度（m/interval）
  speed: number;
  // 進行方向（ラジアン）
  heading: number;
}

const degPerMeterLat = 1 / 111000; // 緯度1mあたりの度
const degPerMeterLon = (lat: number) => 1 / (111000 * Math.cos(lat * Math.PI / 180));

export default function MapPerformanceTest() {
  const mapRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<MovingPoint[]>(null!);

  useEffect(() => {
    if (!mapRef.current) return;

    // 地図初期化
    const map = L.map('map', {
      center: TOKYO_CENTER,
      zoom: 15,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // ランダムな点の生成
    const points: MovingPoint[] = [];
    for (let i = 0; i < POINT_COUNT; i++) {
      // 東京中心から最大0.005度（約550m）以内にランダム配置
      const lat = TOKYO_CENTER.lat + (Math.random() - 0.5) * 0.01;
      const lng = TOKYO_CENTER.lng + (Math.random() - 0.5) * 0.01;
      const marker = L.circleMarker([lat, lng], {
        radius: 4,
        color: 'red',
      }).addTo(map);

      // 初速度と向き
      const speed = 1 + Math.random() * 9; // 10〜100 m/interval
      const heading = Math.random() * 2 * Math.PI;

      points.push({ marker, speed, heading });
    }
    pointsRef.current = points;

    // アニメーションループ
    const timer = setInterval(() => {
      pointsRef.current.forEach(p => {
        const latlng = p.marker.getLatLng();
        // メートル→度換算
        const dLat = p.speed * degPerMeterLat * Math.cos(p.heading);
        const dLng = p.speed * degPerMeterLon(latlng.lat) * Math.sin(p.heading);
        let newLat = latlng.lat + dLat;
        let newLng = latlng.lng + dLng;

        // 範囲外になったら東京中心に戻す
        if (Math.abs(newLat - TOKYO_CENTER.lat) > 0.02 || Math.abs(newLng - TOKYO_CENTER.lng) > 0.02) {
          newLat = (TOKYO_CENTER.lat);
          newLng = (TOKYO_CENTER.lng);
        }

        p.marker.setLatLng([newLat, newLng]);

        // ランダムで向きをわずかに変える
        p.heading += (Math.random() - 0.5) * 0.2;
      });
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(timer);
      map.remove();
    };
  }, [pointsRef]);

  return <div id="map" ref={mapRef} />;
}
