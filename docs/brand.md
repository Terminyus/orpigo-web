# Orpigo — Marka kaynağı (uygulama kodundan çıkarıldı)

Kaynak: `~/Desktop/Orpigo` (Flutter, `applicationId = com.candemsoft.orpigo`, sürüm 1.0.4+14).
Her değerin yanında geldiği dosya yazılıdır. Tahmini değer yoktur.

## 1. Renk tokenları — `lib/core/theme/color_tokens.dart`

### Marka / vurgu (kırmızı)
| Token | Hex | Kullanım |
|---|---|---|
| `accentDark` | `#CC2936` | Logo kırmızısı; koyu temada vurgu ve ORP harfi |
| `accentLight` | `#B01E2A` | Açık temada vurgu ve ORP harfi (daha koyu kırmızı) |
| `accentMuted` | `#CC2936` @ %10 (`#1ACC2936`) | Vurgu zemini |
| `orpGuideLine` | `#CC2936` @ %15 (`#26CC2936`) | Odak çizgisi |
| ORP dikey çizgi | pivot rengi @ %18 | `orp_word_display.dart` |
| ORP üst/alt rayları | pivot rengi @ %25, 28×2 px | `orp_word_display.dart` |

### Açık tema (uygulamada varsayılan tema budur — `settings_provider.dart`: `AppThemeIndex.light`)
| Token | Hex |
|---|---|
| `lightBackground` | `#F7F8FC` |
| `lightSurface` | `#FFFFFF` |
| `lightSurfaceVariant` | `#EEF0F6` |
| `lightSurfaceHigh` | `#E4E7F0` |
| `lightTextPrimary` | `#2D3142` (logo lacivert-grisi) |
| `lightTextSecondary` | `#4B5563` (~7.1:1) |
| `lightTextTertiary` | `#6B7280` (~4.6:1) |
| `lightBorder` | `#E5E7EB` |
| `lightBorderSubtle` | `#E8EAF2` |

### Koyu tema
| Token | Hex |
|---|---|
| `darkBackground` | `#0E0F15` |
| `darkSurface` | `#16182A` |
| `darkSurfaceVariant` | `#1E2134` |
| `darkSurfaceHigh` | `#262A40` |
| `darkTextPrimary` | `#F2F4F8` |
| `darkTextSecondary` | `#A0A6B5` |
| `darkTextTertiary` | `#6A7182` |
| `darkBorder` | `#25283B` |
| `darkBorderSubtle` | `#1F2338` |

### Sitede KULLANILMAYACAK tokenlar
`success #4CAF7D`, `error #E05252`, `warning #F5C842` uygulamada var ama kırmızı-beyaz paletin dışında.
Site bunları kullanmaz. Hata durumları kırmızının kendi tonuyla gösterilir.

### Paletle ilgili not
Uygulamanın "nötr" grileri hafif lacivert tonludur (`#2D3142`, `#16182A` vb.). Bunlar uygulamanın
kendi tokenları olduğu için sitede birebir kullanılır. Bunların dışında hiçbir ton eklenmez.
Gradyanlar yalnızca kırmızı → kırmızının saydam hâli veya zemin → zemin varyantı arasında olur.

### Kontrast kontrolü (WCAG AA)
- `#B01E2A` / `#FFFFFF` → 6.85:1 ✔ · `#B01E2A` / `#F7F8FC` → 6.46:1 ✔ (açık temada kırmızı metin ve butonlar)
- `#FFFFFF` / `#CC2936` → 5.33:1 ✔ (koyu temada buton yazısı)
- `#CC2936` / `#0E0F15` → 3.59:1. Yalnızca büyük metin ve ORP harfi için ✔ (AA large ≥ 3:1). Koyu temada küçük kırmızı metin kullanılmaz; küçük metin `#F2F4F8` olur, kırmızı alt çizgi veya ikonla vurgulanır.
- `#6A7182` / `#0E0F15` → 3.91:1. Koyu temada `darkTextTertiary` küçük metinde kullanılmaz, yerine `darkTextSecondary` (7.85:1) kullanılır.
- `#6B7280` / `#F7F8FC` → 4.56:1 ✔

## 2. Yazı tipleri

| Rol | Font | Kaynak |
|---|---|---|
| Uygulama arayüzü (seçilebilir) | **Inter** (varsayılan), **Lora**, **Nunito** | `app_theme.dart`, `settings_provider.dart` |
| Başlıklar (display / headline) | **Outfit** 700 / 600 | `text_styles.dart` |
| **RSVP okuma kelimesi** | **JetBrains Mono** 400, ORP harfi 700 | `orp_word_display.dart`, `text_styles.dart` |

Önemli: Uygulamadaki Inter/Lora/Nunito seçimi yalnızca arayüz metnini değiştirir. Okuyucudaki kelime
her zaman JetBrains Mono ile çizilir (`OrpWordDisplay` fontFamily ayarını okumaz).

Yazı boyutları (`app_constants.dart`): Küçük 32, Orta 42 (varsayılan), Büyük 52, XL 64.
Kelime satır yüksekliği 1.2. Okuyucu kutusunun yüksekliği `fontSize × 3.2`, köşe yarıçapı 20.

## 3. ORP algoritması — `lib/core/speed_reader_engine.dart`

```
clean = word içindeki harf ve rakamlar (\p{L}\p{N})
len   = clean boşsa word.length, değilse clean.length
len <= 1  → 0
len <= 4  → 1
len <= 8  → 1
len <= 12 → 2
aksi hâlde → 3
```
- İndeks, temizlenmiş kelimeye göre hesaplanır ama **ham kelimeye** uygulanır
  (ör. `"(merhaba"` → indeks 1 → `m`). Port bu davranışı birebir korur.
- `splitAtORP`: indeks `[0, word.length-1]` aralığına sıkıştırılır. Boş kelimede pivot `' '` olur.

## 4. Zamanlama — `speed_reader_engine.dart`, `app_constants.dart`, `reader_provider.dart`

```
base = round(60000 / wpm) ms
smartPauses kapalı → base
kelime . ! ? … ile bitiyorsa → round(base × 2.0)   (sentenceEndMultiplier)
kelime , ; : — ile bitiyorsa → round(base × 1.5)   (clausePauseMultiplier)
word.length > 9 ise          → round(base × 1.3)   (longWordMultiplier, threshold 9, ham uzunluk)
aksi hâlde                   → base
```
Çarpanlar birikmez; ilk eşleşen kural uygulanır. Akıllı duraklamalar varsayılan olarak açıktır.

WPM sınırları: `minWpm 100`, `maxWpm 1000`, `defaultWpm 250`, `freeMaxWpm 300`, `proMaxWpm 1000`.
Kullanıcının gerçek sınırı sunucudan gelir (`app_user.dart`: `max_wpm`, yoksa 400).
Uygulamanın hız kaydırıcısı 100–1000 aralığındadır, 50'lik adımlarla.

Oynatıcı davranışı (`reader_provider.dart`): ekrandaki kelimenin gecikmesi kadar bekler, sonra bir sonrakine geçer.
`seek(±n)`, `prevSentence` / `nextSentence` (. ! ? sınırları), bitince `completed` olur ve oynatma baştan başlar.
Kelime değişiminde 60 ms'lik hafif bir solma vardır (opaklık 1 → 0.65 → 1).

## 5. Uygulamadaki ORP hizalaması (dikkat)

`OrpWordDisplay` belgesi "pivot her zaman yatay merkezdedir" der. Ancak kod, üç parçayı (önce / pivot / sonra)
`mainAxisSize.min` bir `Row` içinde **bütün olarak** ortalar. Sonuçta ORP harfi her kelimede aynı x noktasına
denk gelmez (bkz. `store_assets/android/screenshots/02_reader_light.png`: "Orpigo"da çizgi `r` ile `p` arasında).

Site, belgede yazan amaca uygun davranır: ORP harfinin merkezi, ölçülen genişliklerle odak çizgisine piksel düzeyinde hizalanır.
Uygulamada da aynı düzeltmenin yapılması önerilir (ayrı iş).

## 6. Assetler

| Dosya | Boyut | Kaynak |
|---|---|---|
| `assets/images/logo.png` | 1024² | uygulama |
| `website/assets/logo.png` | 320² | mevcut site |
| `website/assets/screens/*.png` (8 adet: language, onboarding-rsvp, onboarding-speed, onboarding-library, login, library, settings, profile) | 1320×2868 | mevcut site / iOS |
| `store_assets/android/screenshots/0[1-6]_*.png` | 1080×2400 | Play Store. Üstlerinde pazarlama başlığı bant olarak var ("2-3x Daha Hızlı" iddiası dahil). Sitede bant kırpılmadan kullanılmaz. |

Gizli dosyalar (repoya **asla** girmez): `GoogleService-Info*.plist`, `google-services.json`, keystore, `.env`, `api_constants.dart` içeriği.

## 7. Dil ve içerik notları
- Slogan: "Daha hızlı oku. Daha çok hatırla." / "Read faster. Remember more."
- Ücretsiz plan: ayda 1 PDF (`freeMonthlyPdfLimit`), 300 WPM üst sınırı (`freeMaxWpm`). Sunucu farklı değer döndürebilir.
- Uygulama içi ürünler: aylık, yıllık abonelik ve tek seferlik PDF kredisi (`iap_constants.dart`). Kodda sabit fiyat yok → "Güncel fiyatlar uygulama içinde".
- Destek: `destek@orpigo.com`, `https://orpigo.com/support/`.
