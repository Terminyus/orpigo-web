# orpigo-web — Plan

Ana fikir: **Gözün sabit, kelimeler akıyor.** Sayfanın görsel ekseni ekranın ortasındaki tek bir dikey odak çizgisidir (reticle).
Bu çizgi hero'da doğar, scroll boyunca sabit kalır ve her bölüm onun etrafında kurulur. Bu kural, bir animasyonun anlam taşıyıp taşımadığını
sınamak için de kullanılır: Animasyon ya gözün nereye baktığını ya da kelimenin odağa nasıl geldiğini anlatmıyorsa sayfaya girmez.

## Kararlar (2026-10-08)
- Okuyucu fontu: **JetBrains Mono**. Font seçimi yalnızca arayüz metnini etkiler.
- WPM aralığı: **100–1000** (kod ile aynı). Premium bölümünde ücretsiz planın sınırı belirtilir.
- Deploy: GitHub Actions (token'a `workflow` yetkisi kullanıcı tarafından eklenecek).
- Yerel repo: `~/Desktop/orpigo-web`.
- Sayfa zemini beyaz (`#FFFFFF`); site işletim sistemi ayarına bakmadan açık temayla açılır, koyu tema yalnızca düğmeyle.
- Brifteki "Günün özetini 2 dakikada oku" başlığı, gerçek süreyle tutarlı olsun diye "2 dakikadan kısa sürede" yapıldı; süre hız seçimine göre canlı hesaplanır.
- Uygulama içindeki fiyatlar yalnızca önizleme yer tutucusu olduğu için sitede fiyat yok.

## Yığın
- **Vite + vanilla JS (ES modules)**: Statik çıktı verir, framework yükü yoktur ve çok sayfalı build ile `/blog/`, `/privacy/` gibi yolları gerçek klasörler olarak üretir.
- **GSAP + ScrollTrigger**: Scroll'a bağlı sahneler (bölüm 2, 3, 10). **Lenis**: Yumuşak kaydırma. `prefers-reduced-motion` açıkken kapalıdır.
- **pdf.js**: Yalnızca bölüm 9'da, kullanıcı PDF seçince dinamik `import()` ile yüklenir.
- **Vitest**: `src/rsvp/` birim testleri.
- Fontlar self-host edilir (woff2, Latin + Latin Ext alt kümesi): Inter, Lora, Nunito, Outfit, JetBrains Mono. İlk ekranda kullanılanlar preload edilir.
- Deploy: GitHub Actions → GitHub Pages, `base: '/orpigo-web/'`. Canlıya geçişte `base: '/'` olur.

## RSVP motoru — `src/rsvp/`
| Dosya | İçerik |
|---|---|
| `orp.js` | `getORPIndex`, `splitAtORP` (Dart'ın birebir portu, `\p{L}\p{N}` dahil) |
| `timing.js` | `getDelayMs(word, wpm, smartPauses)` ve sabitler (2.0 / 1.5 / 1.3, eşik 9) |
| `tokenize.js` | Metni kelimelere böler (boşluk bazlı, uygulamadaki `WordItem` listesiyle aynı mantık) |
| `player.js` | rAF tabanlı oynatıcı: `play / pause / toggle / seek(±n) / prevSentence / nextSentence / setWpm / setSmartPauses`. Zamanlama, birikmiş hedef zamana göre ilerler (`nextAt += delay`), böylece kare sapması toplanmaz. Sekme gizlenince durur. |
| `view.js` | DOM görünümü: önce / pivot / sonra span'leri. Pivot merkezi `measureText` (canvas, gerçek font) ile ölçülür ve odak çizgisine `translateX` ile hizalanır. Font değişince ölçüm önbelleği temizlenir. |
| `index.js` | `createReader(el, options)` → tüm demoların kullandığı tek API |

Testler: ORP tablosu (0/1/1/2/3 sınırları, noktalama, Türkçe harfler, boş kelime), gecikme çarpanları, sahte saat ile 1000 kelimede toplam sürenin teorik süreden sapmaması,
seek ve cümle atlama sınırları.

## Paylaşılan durum
`src/state.js`: tema, font, yazı boyutu, akıllı duraklama, WPM, dil ve ölçülen normal hız. Değişiklikler olay ile yayılır, böylece bölüm 11'deki bir değişiklik hero'ya anında yansır.
Yalnızca kolaylık amaçlı `localStorage` kullanılır (try/catch ile).

## Bölümler — her animasyon ne anlatıyor

| # | Bölüm | Animasyon | Ne anlatıyor |
|---|---|---|---|
| 1 | **Hero** | Ortada büyük okuyucu, kelimeler akar. ORP harfi kırmızı, üst/alt rayları sabit. Akan metin Orpigo'yu 2-3 cümlede anlatır. Yanda telefon mockup'ında gerçek okuyucu ekranı. İlk girişte odak çizgisi önce çizilir, sonra ilk kelime gelir. | "Önce göster": Ziyaretçi ürünü 5 saniyede kendi gözüyle yaşar. Önce çizginin, sonra kelimenin gelmesi "göz burada sabit" fikrini kurar. |
| 2 | **Gözün aslında zıplıyor** | Paragraf üzerinde kırmızı fiksasyon noktaları sakkadlarla sıçrar ve ara sıra geri döner (regresyon). Scroll ile ekran ikiye ayrılır: solda noktalar zıplamaya devam eder, sağda nokta sabit kalır ve kelimeler ona gelir. Altta iki sayaç: "göz sıçraması" sayısı solda artar, sağda 0'da kalır. | Geleneksel okumanın maliyetini (sıçrama ve geri dönüş) ve Orpigo'nun bunu nasıl kaldırdığını, rakam uydurmadan, sayılarak gösterir. |
| 3 | **ORP nedir** | Büyük bir kelimenin harfleri ayrışır. ORP harfi kırmızıya döner ve odak çizgisine kayar, diğer harfler onun etrafına dizilir. Ziyaretçi kendi kelimesini yazar ve ORP canlı hesaplanır; altında "N harf → ORP = N. harf" kuralı vurgulanır. | Algoritmanın kara kutu olmadığını, basit ve öngörülebilir bir kural olduğunu gösterir. |
| 4 | **Kendi hızını ölç** | (a) Normal okuma: kronometre ve "Bitirdim". (b) RSVP okuma: ölçülen hızın ~%20 üstünde başlar, ziyaretçi ayarlayabilir. Sonuç kartında iki sayı sayarak yerine oturur. İsteğe bağlı 2 soruluk anlama kontrolü. | Vaat yerine ölçüm: Sayılar ziyaretçinin kendi sayılarıdır. Kartta "tek bir ölçüm, kesin sonuç değildir" notu yer alır. |
| 5 | **Okuma süresi hesaplayıcı** | Sayfa veya kelime sayısı girilir. İki yatay çubuk süreye oranla dolar, sayaç saat:dakika olarak döner. | Ölçülen veya "varsayılan" (etiketli) normal hızla Orpigo hızının farkını somut bir kitap süresine çevirir. |
| 6 | **Hayatın içinden** | Kart bandı (marquee) yavaşça kayar, hover veya focus ile durur. Karta tıklanınca band durur, kart büyür ve içinde o türün örnek metni RSVP'de akar. Yanında "Normalde ~N dk / Orpigo ile ~M dk" yazar. | Orpigo'nun yalnızca kitap için değil, günlük PDF'ler için olduğunu gösterir. Süreler, örnek metnin tam belge karşılığı için formülle hesaplanır. |
| 7 | **Klasikleri yeniden oku** | Tipografik kitap kartları (yazar, eser, yıl). Seçilen kartın alıntısı okuyucuda akar. | Uzun metin ve edebi dil ile de çalıştığını gösterir. Tüm alıntılar kamu malıdır (bkz. `credits.md`). |
| 8 | **Sabah bülteni** | Üstte kırmızı-beyaz ticker. "Günün özetini 2 dakikada oku": 4 kısa kurgusal haber art arda akar, ilerleme çubuğu toplam süreyi gösterir. Her kartta "Örnek metin" etiketi bulunur. | Kısa ve sık okumalar için alışkanlık senaryosu. |
| 9 | **Kendi metnini dene** | Textarea → okuyucu. PDF seçilirse pdf.js metni tarayıcıda çıkarır. Altta "Hiçbir veri gönderilmez" notu. | Gerçek kullanım: kendi içeriğinle dene. |
| 10 | **Uygulama turu** | Sabitlenen (pinned) telefon mockup'ında gerçek ekranlar scroll ile değişir; yanda 6 adım vurgulanır. Ekran geçişi dikey kaydırmadır. | Uygulamanın akışı: Dil → Tanışma → PDF → İşleme → Devam → Hız. |
| 11 | **Kişiselleştir** | Tema, font, boyut ve akıllı duraklama kontrolleri. Değişiklik bölümdeki demoya ve hero'ya anında yansır; koyu tema seçilince bölümün zemini uygulamanın koyu tokenlarına geçer. | Ayarların gerçekte ne yaptığını gösterir. Okuyucu her zaman JetBrains Mono kullanır (uygulamayla aynı). Inter/Lora/Nunito seçimi, uygulamadaki gibi arayüz metnini değiştirir. |
| 12 | **Premium** | Statik karşılaştırma tablosu, hafif giriş animasyonu. | Ücretsiz ve Premium farkı. Fiyat yazılmaz: "Güncel fiyatlar uygulama içinde". |
| 13 | **SSS** | Akordeon (`<details>`). | Dürüst cevaplar, ör. anlama kaybı, hangi PDF'ler, çevrimdışı okuma, veriler. |
| 14 | **Final CTA + footer** | Odak çizgisi son kez belirir ve slogan kelime kelime RSVP ile akar, ardından mağaza butonları gelir. | Sayfa, başladığı gibi bir okuma deneyimiyle kapanır. |

Akış değişikliği önerisi yok; verilen sıra hikâyeyi iyi kuruyor (göster → sorun → çözüm → ölç → uygula → kişiselleştir → karar).

## Korunan URL'ler
`/blog/` (+3 yazı), `/privacy/`, `/terms/`, `/support/` ve ayrıca **`/delete-account/`**. Bu sayfa canlı sitemap'te ve destek sayfasında var; mağaza kayıtlarında
hesap silme URL'si olarak tanımlı olabilir. Metinler değiştirilmeden taşınır, yalnızca yeni tasarıma giydirilir.

## Erişilebilirlik ve performans
- `prefers-reduced-motion`: Lenis kapalı, scroll sahneleri statik son kareyi gösterir, RSVP otomatik başlamaz.
- Her okuyucuda görünür bir Oynat/Durdur düğmesi bulunur. Klavye: Space oynat/durdur, ←/→ geri/ileri kelime, ↑/↓ WPM.
- `aria-live` kullanılmaz (kelime akışı ekran okuyucuyu boğar). Bunun yerine her okuyucunun tam metni görsel olarak gizli bir `<p>` içinde bulunur.
- Görseller AVIF + WebP, `loading="lazy"`. Hero görseli preload edilir.

## SEO
title/meta, OG/Twitter, hreflang (tr, en, x-default), sitemap, robots, schema.org `MobileApplication`. Önizleme `noindex,nofollow`
ve robots `Disallow: /`. Canlıya geçişte kaldırılacakları README'de yazılı.
