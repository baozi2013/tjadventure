export type PostEnglishTranslation = {
  title: string;
  excerpt: string;
  content: string;
};

export type CyclingImageEnglishTranslation = {
  alt: string;
  caption?: string;
};

export type CyclingEnglishTranslation = {
  title: string;
  excerpt: string;
  content: string;
  locationNote?: string;
  routeName?: string;
  logistics?: string[];
  notes?: string[];
  images?: Record<number, CyclingImageEnglishTranslation>;
};

export const postEnglishTranslations: Record<string, PostEnglishTranslation> = {
  "big-sur-2022": {
    title: "Big Sur 2022 | Two-Day Coast Camping Notes",
    excerpt:
      "A friend landed a rare Big Sur campsite, so we spent two days by the water and the cliffs. The trip was simple, but the coastline still delivered.",
    content: `## Overview

This was a short Big Sur camping weekend built around a hard-to-get campsite. The plan was not complicated: drive down, set up camp, spend time near the water, and let the coast do most of the work.

## Route Notes

Bixby Creek Bridge, Pfeiffer Beach, and McWay Falls were the core stops. The views were familiar but still strong, especially when the light moved across the cliffs and the water.

The trip itself felt very steady rather than dramatic. It was a reminder that Big Sur does not need a packed schedule to feel worthwhile.

## Takeaway

For a family weekend, Big Sur works best when expectations stay simple: secure a campsite early, keep the driving flexible, and save enough time for the coast.`,
  },
  "carrizo-plain-pas-robles-2026": {
    title: "Carrizo Plain and Paso Robles 2026 | A Spontaneous Wildflower Weekend",
    excerpt:
      "A two-day weekend from Carrizo Plain wildflowers to Paso Robles wine country, with wide ridge views, Soda Lake sunset color, and an easy road-trip rhythm.",
    content: `## Overview

This was a spontaneous spring weekend built around Carrizo Plain wildflowers and a Paso Robles stop. The timing was loose, but the reward was big open scenery and a very different side of California.

## Route Notes

Shell Creek Road started the wildflower chase, while Soda Lake gave the day its softer light. Caliente Mountain Ridge was the standout view: wide, dry, and much more dramatic than expected.

Paso Robles made the second half easier, with food, wine country pacing, and a comfortable reset after the empty roads.

## Takeaway

Carrizo Plain is best treated as a flexible landscape day. Go for flowers, stay for the scale, and keep enough time for sunset around Soda Lake.`,
  },
  "crater-lake-lassen-2022": {
    title: "Crater Lake and Lassen 2022 | A Full-Camping Week",
    excerpt:
      "A camping-heavy week from Klamath Falls and Crater Lake to Lava Beds and Lassen, with caves, high lakes, Lassen Peak, and plenty of fatigue.",
    content: `## Overview

This road trip was built almost entirely around camping. We moved from Klamath Falls to Crater Lake, crossed back toward California through Lava Beds, and finished with Lassen.

## Route Notes

Crater Lake was the visual anchor of the trip: deep blue water, rim views, and a scale that made every stop feel worth it. Lava Beds added a very different texture with cave exploration and a more rugged pace.

Lassen brought high-elevation lakes, geothermal stops, and the bigger hiking effort. It was scenic, but after several camping nights, the tiredness became part of the memory too.

## Takeaway

This route packs a lot into one week. It is rewarding, but full-time camping makes the logistics matter: food, warmth, rest, and realistic driving days all shape the experience.`,
  },
  "death-valley-2022": {
    title: "Death Valley 2022 | Three Desert Days After the Wind Won",
    excerpt:
      "A three-day desert trip where wind destroyed the first-night camping plan, followed by a quick hotel rescue and a tour of Death Valley's classic viewpoints.",
    content: `## Overview

Death Valley started with a lesson from the wind. The first night of camping did not survive the conditions, so the plan changed quickly: get a nearby hotel and keep the trip moving.

## Route Notes

Once the sleeping plan was fixed, the classic stops still worked well. Mesquite Flat Sand Dunes, Zabriskie Point, Badwater Basin, and Dante's View gave the trip a complete desert arc.

The landscape felt huge and exposed. That was the beauty of it, and also the reason the wind could take over so quickly.

## Takeaway

Death Valley rewards flexibility. Camping can be memorable, but weather has the final vote. A backup lodging plan can turn a rough start back into a good trip.`,
  },
  "del-valle-2026": {
    title: "Del Valle 2026 | A Bay Area Little-Switzerland Day Trip",
    excerpt:
      "A weekend visit to Del Valle for green hills and lake views: easy hiking, pretty scenery, tight parking, and one parking ticket.",
    content: `## Overview

Del Valle was a short Bay Area weekend escape. The green slopes and lake views made it feel bigger than the distance from home suggested.

## Route Notes

The main area and East Shore Trail were enough for a relaxed day. The hiking was not difficult, so the trip worked well as a low-pressure family outing.

The only real friction was parking. The lot situation was tight, and the ticket became part of the story.

## Takeaway

Del Valle is a good half-day nature reset when the hills are green. Arrive earlier than feels necessary, especially on a pretty weekend.`,
  },
  "fallen-leaf-2023": {
    title: "Fallen Leaf 2023 | Two Days Camping by a Tahoe Forest Lake",
    excerpt:
      "A relaxed Fallen Leaf Lake camping weekend with mountain views, paddle boarding, sand play, and a slow Tahoe rhythm.",
    content: `## Overview

Fallen Leaf was a gentle two-day camping weekend near Tahoe. The pace stayed loose: lake time, campground time, and small family moments rather than a packed checklist.

## Route Notes

Fallen Leaf Campground made a simple base. The lake gave us mountain reflections, beach time, paddle boarding, and enough space for the kids to disappear into sand projects.

Tahoe Tallac Historic Site added a light sightseeing stop before the return home.

## Takeaway

Fallen Leaf is best for slow Tahoe days. It works well when the goal is not to conquer a route, but to let the lake and campground carry the weekend.`,
  },
  "filoli-garden-2025": {
    title: "Filoli Garden 2025 | A Slow Independence Day Garden Visit",
    excerpt:
      "A mellow July 4th day trip through Filoli's estate and gardens, with an easy walking pace and lots of photos.",
    content: `## Overview

Filoli made for a calm Independence Day outing. The trip was not about distance or difficulty; it was about walking slowly, taking photos, and letting the garden set the pace.

## Route Notes

The estate and garden areas are compact enough for a relaxed visit but varied enough to keep the camera busy. The flowers, paths, and historic house all made the day feel polished.

## Takeaway

Filoli is an easy Bay Area reset when a full road trip is too much. Go slow, bring a camera, and let the garden do the talking.`,
  },
  "google-alviso-2026": {
    title: "Google and Alviso 2026 | From a Colorful Campus to Pink Salt Ponds",
    excerpt:
      "A half-day route from Google Visitor Experience public art and store time to Alviso Marina County Park's pink salt ponds and wetland boardwalk.",
    content: `## Overview

This half-day route paired a very Bay Area indoor-outdoor stop with nearby wetland scenery. Google Visitor Experience gave the morning a colorful, polished start, and Alviso made the finish feel open and quiet.

## Route Notes

At Google, the public art, shop, and campus details made it easy to wander without much planning. Alviso Marina County Park shifted the mood completely with salt ponds, boardwalk views, and wetland light.

## Takeaway

Google plus Alviso works well as a short family route. It is low effort, close to home, and surprisingly varied for a half day.`,
  },
  "henry-cowell-2023": {
    title: "Henry Cowell 2023 | Two Days Camping in the Redwoods",
    excerpt:
      "A two-day Henry Cowell camping weekend with redwoods, banana slugs, ridge views, and the first successful trip for the new North Face tent.",
    content: `## Overview

Henry Cowell was a compact redwood camping weekend near Santa Cruz. It gave us forest shade, short hikes, and enough campground time to test the new tent properly.

## Route Notes

The redwood trails were the main draw, with banana slugs adding the kind of small discovery kids remember. A ridge viewpoint opened the trip beyond the forest and gave us a wider look over the area.

The new North Face tent passed its first real use without drama.

## Takeaway

Henry Cowell is a strong beginner-friendly camping choice: close, scenic, and varied enough for a family weekend without overloading the schedule.`,
  },
  "lake-tahoe-2024": {
    title: "Lake Tahoe 2024 | Weekend Lake Loop Ride Notes",
    excerpt:
      "A weekend built around riding the Lake Tahoe loop: about 70 miles on day one, a return drive on day two, and a high-elevation ride with strong views and good company.",
    content: `## Overview

This Tahoe weekend had one clear goal: ride around the lake. The route started from the north shore, carried us through a full day of high-elevation riding, and left day two for packing and the drive home.

## Route Notes

The lake loop is beautiful but not free. Elevation, distance, wind, and rolling terrain all add up. Emerald Bay gave the day its strongest scenery and its most memorable photo stop.

Riding with a group made the effort feel more manageable. The views helped too.

## Takeaway

Tahoe is a worthy weekend cycling target, but it is better with margin: arrive the night before, pace the first half, and avoid treating altitude like flatland.`,
  },
  "los-angeles-santa-monica-2014": {
    title: "Los Angeles and Santa Monica 2014 | Four Family Days from City Streets to the Beach",
    excerpt:
      "A spring-break photo-album revisit: Los Angeles city stops plus slow Santa Monica beach time across an easy four-day family route.",
    content: `## Overview

This is a look back at an older 2014 spring-break family trip. The route mixed classic Los Angeles city stops with slower beach time around Santa Monica.

## Route Notes

Griffith Observatory, Hollywood, Santa Monica Pier, and Venice Beach gave the trip an easy first-time LA shape. The schedule stayed light, which made the photos and city wandering feel more relaxed.

## Takeaway

For a family LA trip, mixing city landmarks with beach walks still works. The key is not trying to make every day too efficient.`,
  },
  "mammoth-lake-2024": {
    title: "Mammoth Lake 2024 | Four Days from Tioga Pass to Mammoth Lakes",
    excerpt:
      "A four-day Sierra trip: Yosemite and Tioga Pass on day one, Mammoth Gran Fondo on day two, Convict Lake and hot springs on day three, and a Mono Lake return delay on day four.",
    content: `## Overview

Mammoth was both a family trip and a cycling weekend. The route crossed Yosemite and Tioga Pass, centered on Mammoth Gran Fondo, then slowed down around lakes and geothermal stops.

## Route Notes

Day one was the big transfer through Yosemite and Tioga Pass. Day two belonged to the Gran Fondo, a long high-elevation road ride that shaped the whole weekend.

Convict Lake and the hot spring landscape made day three feel like recovery. The return day added its own twist with a delayed opening near Mono Lake.

## Takeaway

Mammoth works well when the trip balances effort and recovery. Put the hard ride in the middle, then give the family itinerary room to breathe.`,
  },
  "maui-2025-family-trip": {
    title: "Maui 2025 | Six-Day Family Trip Notes",
    excerpt:
      "Six Maui days from Kaanapali to Kihei and Haleakala sunset, with snorkeling, coastal driving, and clouds above the volcano.",
    content: `## Overview

Maui gave us a six-day family trip with beaches, drives, snorkeling, and a big volcano sunset. The route moved between resort time, coastal roads, and higher-elevation scenery.

## Route Notes

Kaanapali and Kihei handled the beach side of the trip. The Road to Hana style of driving and coastline stops added movement, while Haleakala gave the journey its most dramatic view.

Iao Valley was a useful lighter stop before leaving, especially after several days of sun and water.

## Takeaway

Maui is best when the schedule alternates between active days and soft days. Snorkel, drive, chase sunset, then protect enough quiet time to actually feel like vacation.`,
  },
  "miami-houston-2026": {
    title: "Miami and Houston 2026 | Four Days from Beach Murals to Rockets",
    excerpt:
      "A four-day switch from Wynwood and South Beach in Miami to Houston's space exhibits: street art and ocean first, rockets and space stories after.",
    content: `## Overview

This four-day trip split itself into two very different halves. Miami brought color, beach air, and street art. Houston shifted the mood toward rockets, exhibits, and space history.

## Route Notes

Wynwood Walls and South Beach made the Miami portion easy to photograph. Puerto Sagua added a classic food stop before the trip changed cities.

Space Center Houston gave the second half a clear anchor and a completely different kind of family activity.

## Takeaway

Miami and Houston make an unusual but memorable pairing. The contrast is the point: beach and murals first, space and exhibits second.`,
  },
  "mission-peak-2026-first-climb": {
    title: "Mission Peak 2026 First Climb | Turning the Legs Back On",
    excerpt:
      "The first Mission Peak climb of 2026: 5.3 miles and 1,739 feet of gain on Strava, with a turnaround before the summit but enough wind and Bay Area views.",
    content: `## Overview

This was the first Mission Peak climb of 2026, and it felt like waking the legs back up. We did not summit, but the effort still counted.

## Route Notes

Strava recorded 5.3 miles and 1,739 feet of gain. The climb, wind, and open Bay Area views were enough to make the outing feel complete even with a turnaround below the top.

## Takeaway

Not every Mission Peak day needs the summit photo. Sometimes the useful part is simply getting back onto the hill and remembering the rhythm.`,
  },
  "monterey-17-mile-drive-carmel-2026": {
    title: "Monterey, 17-Mile Drive, and Carmel 2026 | A Blue-Sky Coast Day",
    excerpt:
      "A sunny Monterey, 17-Mile Drive, and Carmel-by-the-Sea day route with Spanish Bay, Bird Rock, Lone Cypress, and an easy town walk.",
    content: `## Overview

This was a clean coastal day route: Monterey first, then 17-Mile Drive, then Carmel-by-the-Sea to finish. The weather did a lot of the work.

## Route Notes

Spanish Bay brought white sand and bright water. Bird Rock added wildlife and rocky coastline views, while Lone Cypress gave the classic 17-Mile Drive stop.

Carmel slowed the day down with a town walk after the drive.

## Takeaway

On a clear day, this route is almost too easy to recommend. Keep the schedule light and let each coastal stop have enough space.`,
  },
  "monterey-17miles-2024": {
    title: "Monterey and 17-Mile Drive 2024 | A Christmas Coast Walk",
    excerpt:
      "A Christmas outing through Monterey Fisherman's Wharf and 17-Mile Drive, with beautiful ocean views, dense coastal homes, and an easy holiday pace.",
    content: `## Overview

This Christmas coast outing was simple: Monterey waterfront, 17-Mile Drive, and a slow look at the ocean along the way.

## Route Notes

Fisherman's Wharf gave the trip a holiday waterfront start. The drive carried us past classic coastline, ocean views, and the kind of houses that naturally invite a little envy.

## Takeaway

Monterey and 17-Mile Drive work well for a holiday day trip. It is scenic, low effort, and easy to adjust around weather or family energy.`,
  },
  "mt-shasta-2022": {
    title: "Mount Shasta 2022 | Three Days of First Snow Play with Kids",
    excerpt:
      "A first family ski-learning trip where the kids preferred playing in the snow, with cold Shasta weather, a wood stove, and a memorable cabin rhythm.",
    content: `## Overview

This Shasta winter trip was supposed to include learning to ski, but the kids made their own priority clear: snow play was the real attraction.

## Route Notes

Mount Shasta City handled the supply stop, and the snow play area gave the family the easiest fun. The ski park still mattered, but the beginner experience was secondary to simply being in snow.

The cabin, cold weather, wood stove, and firewood became part of the memory.

## Takeaway

For a first family snow trip, do not over-plan the skiing. Warm layers, flexible expectations, and a cozy base may matter more than slope time.`,
  },
  "palm-spring-2025": {
    title: "Palm Springs and Joshua Tree 2025 | Two Desert Days over Christmas Break",
    excerpt:
      "A Tesla road trip to Palm Springs and Joshua Tree, with cactus gardens, giant boulders, deep-sky photos, moon shots, and a Milky Way visible to the eye.",
    content: `## Overview

This Christmas-break desert trip paired Palm Springs comfort with Joshua Tree scenery. Daytime belonged to cactus gardens and boulders; night belonged to the sky.

## Route Notes

Cholla Cactus Garden and Hidden Valley gave the national park its strongest daytime shape. Palm Springs made the trip easier with food, charging, and a softer place to reset.

The night sky was the surprise highlight. The Milky Way and moon photos made the desert feel much larger after dark.

## Takeaway

Joshua Tree rewards both daylight and night planning. Bring layers, watch battery and charging plans, and leave space for stargazing.`,
  },
  "pasifika-steam-fest-2026": {
    title: "Pasifika STEAM Fest 2026 | A Half-Day Family Tech Event",
    excerpt:
      "A half-day indoor Pasifika STEAM Fest visit, followed by a quick outdoor photo stop near the Roblox building.",
    content: `## Overview

This outing centered on Pasifika STEAM Fest, an indoor family-friendly technology and maker event. It was a compact weekend activity rather than a full-day trip.

## Route Notes

The main event provided the hands-on portion: interactive stations, kid-friendly exhibits, and enough movement to keep the day active without making it exhausting.

Afterward, we made a short photo stop outside the Roblox office area before heading home.

## Takeaway

For families, events like this work well as a half-day energy burn. The best plan is simple: focus on the event, then add one nearby stop if everyone still has energy.`,
  },
  "pinnacles-detour-2026": {
    title: "Pinnacles 2026 | A Wrong Turn and a Different View",
    excerpt:
      "A family return to Pinnacles that accidentally became a harder route, wearing Jane out but adding high rock walls and cave scenery.",
    content: `## Overview

This Pinnacles revisit was supposed to be an easier family route. A wrong turn changed that, and the day became tougher than planned.

## Route Notes

The east-side entry and Bear Gulch area set up the hike. The accidental harder section added effort, but it also brought higher rock walls, better views, and a different feeling from the previous visit.

The cave section helped redeem the detour.

## Takeaway

Pinnacles is beautiful, but route choices matter. Double-check the trail plan before the family is already committed to extra climbing.`,
  },
  "pinnicle-2025": {
    title: "Pinnacles 2025 | A One-Day Family Photo Journal",
    excerpt:
      "A Pinnacles day trip with entrance photos, rock-wall trails, cave exploration, and a lakeside finish: light hiking with strong photos.",
    content: `## Overview

This was a one-day family visit to Pinnacles. The route stayed light, but the scenery gave us plenty to photograph.

## Route Notes

The east entrance, Bear Gulch Cave Trail, and reservoir made a tidy day-trip sequence. The rocks and cave sections gave the kids enough adventure without turning the day into a hard hike.

## Takeaway

Pinnacles works well as a family day trip when the route stays focused. Cave access and parking can shape the day, so check conditions before leaving.`,
  },
  "san-jose-easter-2026": {
    title: "San Jose Easter Event 2026 | A Half-Day Egg Hunt and Kid Energy Burn",
    excerpt:
      "A community-park Easter event with check-in photos, playground warm-up, grouped egg hunting, and an easy half-day family rhythm.",
    content: `## Overview

This was a local Easter event at a San Jose community park. The schedule was simple and kid-focused: check in, warm up, hunt eggs, and head home before the day got too long.

## Route Notes

The playground helped burn early energy before the organized egg hunt. The themed photo area gave the day a clear family-event memory without requiring much planning.

## Takeaway

Local events like this are best when they stay short. Half a day is enough for the kids to feel involved without turning the holiday into logistics.`,
  },
  "sea-otter-2025": {
    title: "Sea Otter 2025 | Monterey Bike Expo and Two Days of Riding",
    excerpt:
      "A Monterey Sea Otter weekend: an easy 50-mile ride on day one and a 10-plus-mile family ride on day two.",
    content: `## Overview

Sea Otter turned the Monterey weekend into a mix of cycling event, expo time, and family riding. It worked because the trip had both a rider goal and a family version of the same weekend.

## Route Notes

Day one centered on the longer ride, about 50 miles. Day two shifted to a shorter family ride, which made the event feel more inclusive instead of just being a solo cycling weekend.

The expo and Monterey waterfront gave everyone something to do between rides.

## Takeaway

Sea Otter is a strong weekend format when cycling and family travel need to coexist. Plan ride time, expo time, and recovery time as separate parts of the trip.`,
  },
  "sequoia-kings-canyon-2026": {
    title: "Sequoia and Kings Canyon 2026 | Giant Trees, Canyon Roads, and Road's End",
    excerpt:
      "A two-day national-park weekend with giant sequoias, Moro Rock, canyon roads, Grizzly Falls, and the green meadow and mountains at Road's End.",
    content: `## Overview

This weekend packed Sequoia and Kings Canyon into two days. The trip moved from giant-tree landmarks to canyon roads and finally into the quieter feeling of Road's End.

## Route Notes

General Sherman Tree and Moro Rock gave Sequoia its classic stops. Kings Canyon shifted the scale with a long road, river views, Grizzly Falls, and the green open space near Road's End.

It was a full weekend, but the variety made the drive feel worthwhile.

## Takeaway

Two days is enough for a strong first pass, but not enough to be slow everywhere. Pick the must-see stops, then let the canyon road have time.`,
  },
  "stars-and-strides-5k-2024": {
    title: "Stars and Strides 5K 2024 | A Family Event Day",
    excerpt:
      "A lively 5K event with morning meetup, warm-up, course photos, and finish-line moments: light effort with good ceremony.",
    content: `## Overview

Stars and Strides 5K was more about the family event feeling than the difficulty. The distance was friendly, and the morning had enough structure to feel special.

## Route Notes

The start and finish area, course photos, and finish-line memories carried the day. It was a good example of a short event becoming more meaningful because everyone joined.

## Takeaway

A 5K can be a great family activity when the atmosphere is welcoming. The ceremony matters as much as the pace.`,
  },
  "stars-and-stripes-5k-2025": {
    title: "Stars and Stripes 5K 2025 | A Summer Family Run",
    excerpt:
      "A friendly summer 5K from pre-race meetup to finish line, with a warm atmosphere and an easy fit for a half-day family activity.",
    content: `## Overview

The 2025 Stars and Stripes 5K kept the same family-friendly rhythm: gather, run or walk, finish, take photos, and still have the rest of the day.

## Route Notes

The event was easy to join as a family because the mood stayed welcoming. It had enough energy to feel like an occasion without requiring serious race preparation.

## Takeaway

For summer weekends, a short organized run is a useful family format: movement, community, photos, and a clean endpoint.`,
  },
  "teton-yellowstone-2024": {
    title: "Teton and Yellowstone 2024 | Nine-Day Road Trip Notes",
    excerpt:
      "A 2,500-mile road trip with five focused days in Grand Teton and Yellowstone: bears, elk, bison, Old Faithful, Morning Glory Pool, and a few restaurant lessons.",
    content: `## Overview

This was a big national-park road trip: roughly 2,500 miles round trip, with the core days split between Grand Teton and Yellowstone.

## Route Notes

Grand Teton gave the trip mountains, lakes, and wildlife momentum. Yellowstone added geothermal features, bison, Old Faithful, and the color of Morning Glory Pool.

The animal sightings were a major part of the memory, but so were the practical lessons: where food worked, where it did not, and how much driving the route really required.

## Takeaway

Teton and Yellowstone reward deep time. The highlights are famous for a reason, but the trip works best when wildlife stops, meals, and long drives all have room in the plan.`,
  },
  "yosemite-2024": {
    title: "Yosemite 2024 | Firefall Watching and Waterfall Hiking",
    excerpt:
      "Two Yosemite days: waiting for Firefall on day one, then Yosemite Falls Trail, Bridalveil Fall, and classic valley viewpoints on day two.",
    content: `## Overview

This Yosemite weekend had two clear pieces: Firefall watching first, then a more active waterfall and viewpoint day.

## Route Notes

Day one required patience around El Capitan and the Firefall viewing window. Day two moved the trip into Yosemite Falls Trail, Bridalveil Fall, and Tunnel View.

The combination made the weekend feel complete: one rare light event, one classic hiking day, and several valley views.

## Takeaway

Firefall needs timing and patience, but Yosemite still works even if the light is uncertain. Pair the wait with a strong day-two route so the trip does not depend on one moment.`,
  },
};

export const cyclingEnglishTranslations: Record<string, CyclingEnglishTranslation> = {
  "henry-coe-climb-2023": {
    title: "Henry Coe Climb 2023 | South Bay Hard Climbing Day",
    excerpt:
      "A 51.7 mi Henry Coe climbing day with 3,858 ft of gain and 4h45m of moving time, turning a long-awaited 50-plus-mile ride into a hard one.",
    locationNote: "South Bay foothills climb captured from the public Strava activity.",
    logistics: [
      "The public Strava record shows 51.7 mi, 3,858 ft of climbing, and 4h45m of moving time.",
      "Henry Coe routes are exposed and hilly, so water and pacing matter early.",
      "Treat this as a long climbing day rather than a casual South Bay spin.",
    ],
    notes: [
      "The ride brought back the feeling of a true 50-plus-mile day.",
      "The bridge and bike photo became the strongest visual memory from the route.",
    ],
    images: {
      0: {
        alt: "Road bike leaning on a steel bridge during the Henry Coe climb",
        caption: "A short bridge stop, with blue sky and red steel giving the route a clear South Bay foothills feel.",
      },
      1: {
        alt: "Open hillside view from the Henry Coe ride",
        caption: "Open hillside views after the climbing started to add up.",
      },
      2: {
        alt: "Snack break on a picnic table during the Henry Coe ride",
        caption: "On a 50-plus-mile climbing day, a snack break is part of the route plan.",
      },
      3: {
        alt: "Road bike parked near a small ranch structure",
        caption: "The route felt more rural and hilly after moving deeper into the Henry Coe area.",
      },
      4: {
        alt: "Henry Coe visitor center sign on a red building",
        caption: "The visitor center stop became the clearest landmark from the climbing day.",
      },
    },
    content: `## Ride Overview

Henry Coe made this a hard South Bay climbing day. The public Strava record shows 51.7 mi, 3,858 ft of climbing, and 4h45m of moving time.

## Route Feel

The route was not just long; it kept asking for climbing legs. The foothills around Henry Coe make pacing and water planning more important than the mileage alone suggests.

## Takeaway

This is the kind of ride that feels satisfying because it is not casual. It is a good benchmark for future long South Bay climbing days.`,
  },
  "lake-tahoe-2024": {
    title: "Lake Tahoe 2024 | Tour de Tahoe Lake Loop Ride",
    excerpt:
      "A 74.5 mi loop from Kings Beach around Lake Tahoe, with altitude, 3,688 ft of climbing, and Emerald Bay as the clearest memory.",
    locationNote: "Lake loop route starting from Kings Beach.",
    logistics: [
      "Stay near Kings Beach the night before to reduce morning driving pressure.",
      "Use South Lake Tahoe as a key resupply point for water and calories.",
      "Altitude makes the effort feel sharper, so keep the first half controlled.",
    ],
    notes: [
      "Emerald Bay was the most ceremonial climb and photo stop of the day.",
      "Cooler weather helped, but wind, distance, and rolling terrain still added up.",
    ],
    images: {
      0: {
        alt: "Bike-lift photo near Emerald Bay during the Lake Tahoe loop ride",
        caption: "A classic photo stop near the high point of the day.",
      },
      1: {
        alt: "Mid-ride resupply break during the Lake Tahoe loop",
        caption: "Resupply mattered more than pushing hard all day.",
      },
      2: {
        alt: "Packing bikes after the Lake Tahoe ride weekend",
        caption: "Day 2 was mostly packing and heading home after finishing the loop.",
      },
    },
    content: `## Ride Overview

This was a clear bucket-list ride: go to Lake Tahoe for the weekend and ride the full loop. The Strava record shows 74.5 mi, 3,688 ft of climbing, and 5h05m of moving time.

## Route Feel

Starting from Kings Beach made the morning easier. The loop was beautiful, but altitude, rolling terrain, and lake wind all made the effort real. Emerald Bay gave the day its most memorable climb and photo stop.

## Takeaway

Tour de Tahoe is a strong weekend goal, especially with friends. The route is worth it, but it is smarter to pace the first half and leave room for the later climbs.`,
  },
  "mammoth-lake-2024": {
    title: "Mammoth Lakes 2024 | Mammoth Gran Fondo High-Altitude Road Ride",
    excerpt:
      "A 71.0 mi Mammoth Gran Fondo with high-elevation roads, 3,648 ft of climbing, and a family-supported finish weekend.",
    locationNote: "Mammoth Gran Fondo start and finish area.",
    logistics: [
      "This ride was day two of a four-day Mammoth family trip after arriving via Tioga Pass.",
      "Altitude and rolling terrain make early pacing more important than the numbers suggest.",
      "Convict Lake and Hot Creek work well as recovery-day stops after the ride.",
    ],
    notes: [
      "The Strava activity title was Morning Ride; this page organizes it as Mammoth Gran Fondo based on the ride context.",
      "The event was primarily on paved road.",
      "Finishing with family around made the weekend feel more complete.",
    ],
    images: {
      0: {
        alt: "Selfie before the Mammoth Gran Fondo start",
        caption: "Morning gathering before rolling onto the high-elevation route.",
      },
      1: {
        alt: "On-course Mammoth Gran Fondo ride photo",
        caption: "A course photo that also became the cover for this ride log.",
      },
      2: {
        alt: "Family meal after finishing Mammoth Gran Fondo",
        caption: "Refueling with family after 71 miles.",
      },
    },
    content: `## Ride Overview

Mammoth Gran Fondo was the main cycling task of the weekend. The ride covered 71.0 mi with 3,648 ft of climbing and 5h02m of moving time.

## Route Feel

High elevation changed the effort. The distance and climbing were manageable, but the route still rewarded patience, steady pacing, and saving energy for the later rolling sections.

## Takeaway

This was a solid event ride with a family-trip frame around it. The best version of the weekend pairs the hard ride with easy recovery stops afterward.`,
  },
  "mount-diablo-2025": {
    title: "Mount Diablo 2025 | First Diablo Climb",
    excerpt:
      "A first Mount Diablo attempt with 43.1 mi of road riding, 4,386 ft of climbing, and a benchmark for this Bay Area classic.",
    locationNote: "The Strava route map shows the ride approaching Mount Diablo from the San Ramon and Danville side.",
    logistics: [
      "The public Strava record shows 43.1 mi, 4,386 ft of climbing, and 4h09m of moving time.",
      "The route map suggests an approach from the San Ramon and Danville side.",
      "Long climbing and the descent both require water, food, and attention.",
    ],
    notes: [
      "The original Strava title was Diablo first experience.",
      "The public activity page includes a route map but no additional ride photos.",
      "The cover uses a Wikimedia Commons Mount Diablo Summit photo.",
    ],
    images: {
      0: {
        alt: "Mount Diablo summit and the paved road toward the communication towers",
        caption: "Mount Diablo Summit photo by Oleg Alexandrov, CC BY-SA 3.0 via Wikimedia Commons.",
      },
      1: {
        alt: "Strava route map approaching Mount Diablo from the San Ramon and Danville area",
        caption: "Route map from the public Strava activity page.",
      },
    },
    content: `## Ride Overview

This was the first Mount Diablo climb in the ride log. The Strava data shows 43.1 mi, 4,386 ft of climbing, and 4h09m of moving time.

## Route Feel

The distance is not extreme by itself, but more than four thousand feet of climbing makes the day substantial. The public route map points to an approach from the San Ramon and Danville side.

## Takeaway

The title is simple because the goal was simple: complete the first Diablo climb and create a benchmark for future attempts.`,
  },
  "mount-hamilton-2022": {
    title: "Mount Hamilton 2022 | Nice Day to Climb Hamilton",
    excerpt:
      "A 38.64 mi Mount Hamilton Road climb with 4,987 ft of gain, making the summit view the reward for the day.",
    logistics: [
      "This is a sustained road climb with 4,987 ft of gain across 38.64 mi.",
      "Water and calories matter because the climb is long and steady.",
      "Save focus for the descent after reaching the summit.",
    ],
    notes: [
      "The Strava activity title was Nice day to climb Hamilton.",
      "The summit bike photo is the clearest proof-of-finish image from the ride.",
    ],
    images: {
      0: {
        alt: "Road bike near the Mount Hamilton summit guardrail with Strava stats",
        caption: "The summit photo after finishing the climb.",
      },
    },
    content: `## Ride Overview

This ride had one direct theme: climb Mount Hamilton Road. The Strava record shows 38.64 mi, 4,987 ft of climbing, and 3h21m of moving time.

## Route Feel

Mount Hamilton is a classic Bay Area road climb. The key is managing effort across a long, steady ascent instead of burning too much energy early.

## Takeaway

The summit view made the work feel worthwhile. With the data and photo saved, the route now has a clear baseline for next time.`,
  },
  "mount-umunhum-2023": {
    title: "Mount Umunhum 2023 | MTB Climb Record",
    excerpt:
      "A 39.5 mi Mount Umunhum mountain-bike ride with 5,033 ft of climbing and 6h01m of moving time, using a same-place photo as the temporary cover.",
    locationNote:
      "The public Strava activity is listed as a mountain bike ride; the cover is a same-place replacement photo, not a photo from ride day.",
    logistics: [
      "The public Strava record shows 39.5 mi, 5,033 ft of climbing, and 6h01m of moving time.",
      "The original route information is limited, so this page keeps to verifiable Strava data.",
      "The cover photo is from the same place but not from the ride day.",
    ],
    notes: [
      "This belongs in the gravel and MTB side of the cycling collection.",
      "The biggest confirmed detail is the climbing load: more than 5,000 ft.",
    ],
    images: {
      0: {
        alt: "Same-location Mount Umunhum photo used as a temporary cover for the 2023 ride",
        caption: "A same-place Mount Umunhum replacement photo used as the temporary cover, not a photo from the 2023-09-09 ride.",
      },
      1: {
        alt: "Strava route map for the Mount Umunhum 2023 mountain bike ride",
        caption: "The public Strava route map is the most direct verifiable record for this ride.",
      },
    },
    content: `## Ride Overview

Mount Umunhum was logged as a mountain bike ride, with 39.5 mi, 5,033 ft of climbing, and 6h01m of moving time.

## Route Feel

The public Strava details are limited, so the page sticks to the verified data. The climbing alone makes it clear this was a serious day on the bike.

## Takeaway

The temporary cover is from the same location rather than the ride day. That is not perfect, but it keeps the place represented until a better photo exists.`,
  },
  "sea-otter-2025": {
    title: "Sea Otter 2025 | Monterey Bike Expo and Two-Day Ride Weekend",
    excerpt:
      "A Monterey Sea Otter weekend with a 52.2 mi event ride on day one and a 10.3 mi family ride on day two.",
    locationNote: "Sea Otter main venue and event-weekend base.",
    logistics: [
      "Day 1 was the main 52.2 mi ride with 3,392 ft of climbing and 3h31m of moving time.",
      "Day 2 added a 10.3 mi family ride with 1,381 ft of climbing and 1h21m of moving time.",
      "The expo is large enough to deserve its own time for walking, food, and photos.",
    ],
    notes: [
      "Sea Otter works especially well when personal riding and family activity share the same weekend.",
      "Monterey gives the non-riding parts of the trip enough scenery to stay interesting.",
    ],
    images: {
      0: {
        alt: "Sea Otter 2025 day one ride group photo",
        caption: "The day one ride group had good energy before and after rolling out.",
      },
      1: {
        alt: "Cycling near the Monterey waterfront during Sea Otter weekend",
        caption: "A coastal segment near Monterey Bay.",
      },
      2: {
        alt: "Sea Otter day two family ride course photo",
        caption: "Day two was the family ride.",
      },
      3: {
        alt: "Sea Otter expo and Cannery Row area",
        caption: "Beyond the rides, the expo and waterfront were worth slow time.",
      },
    },
    content: `## Ride Overview

Sea Otter 2025 turned into a two-day cycling weekend. Day one was the longer event ride at 52.2 mi, and day two brought the family into a shorter 10.3 mi ride.

## Route Feel

The weekend worked because it had more than one mode. There was a proper ride, a family ride, expo time, and Monterey waterfront time.

## Takeaway

Sea Otter is a useful model for family-friendly cycling travel: one weekend can hold a serious ride and a shared family activity.`,
  },
  "south-san-jose-to-coyote-valley-loop-2025": {
    title: "South San Jose to Coyote Valley Loop 2025",
    excerpt: "A 51.3 mi South San Jose to Coyote Valley road loop with 2,103 ft of climbing.",
    content: `## Ride Overview

This Strava-synced ride became a published road-loop entry because it cleared the long-ride filter. The route starts and ends in South San Jose and reaches toward Coyote Valley.

## Route Feel

The ride logged 51.3 mi, 2,103 ft of climbing, and 3h33m45s of moving time. The route cover and GeoJSON track were generated from the Strava GPS trace.

## Takeaway

This page keeps the activity lightweight but useful: title by location, verified ride stats, a route image, and the original Strava source.`,
  },
  "south-san-jose-to-cupertino-loop-2025": {
    title: "South San Jose to Cupertino Loop 2025",
    excerpt: "A 54.5 mi South San Jose to Cupertino road loop with 1,667 ft of climbing.",
    content: `## Ride Overview

This Strava-synced ride was published as a longer South Bay road loop. The route starts and ends in South San Jose and reaches toward Cupertino.

## Route Feel

The ride logged 54.5 mi, 1,667 ft of climbing, and 3h28m34s of moving time. The route image and GeoJSON overlay come from the Strava GPS trace.

## Takeaway

The entry is intentionally practical: location-based title, verified stats, route visualization, and a direct Strava source link.`,
  },
  "tierra-bella-2023": {
    title: "Tierra Bella 2023 | 77-Mile Event Ride",
    excerpt:
      "A 78.3 mi Tierra Bella road event ride with 3,241 ft of climbing and 5h36m of moving time, sitting right at the comfortable edge.",
    logistics: [
      "The public Strava record shows 78.3 mi, 3,241 ft of climbing, and 5h36m of moving time.",
      "This is a long event ride, so food and water planning matter from the beginning.",
      "The route is best treated as a full-day ride rather than a quick morning loop.",
    ],
    notes: [
      "The ride sat right at the edge of comfortable long-distance effort.",
      "Event support helps, but pacing still decides how the final miles feel.",
    ],
    images: {
      0: {
        alt: "Tierra Bella rest stop table with a water bottle, snacks, and bikes in the background",
        caption: "The mid-ride rest stop mood: bottle, snacks, bike frames, and a short pause before rolling again.",
      },
      1: {
        alt: "Tierra Bella rest stop with grapes, banana, wrap, and a Gran Fondo water bottle",
        caption: "The small things on the rest-stop table explain the rhythm of a long event ride: eat a bit, refill a bit, keep moving.",
      },
    },
    content: `## Ride Overview

Tierra Bella 2023 was a long event ride: 78.3 mi, 3,241 ft of climbing, and 5h36m of moving time.

## Route Feel

The distance made this more than a casual event. Support and route structure helped, but the ride still required steady pacing and enough fuel.

## Takeaway

This sits right at the edge of comfortable long-distance riding. It is a useful benchmark for future event rides.`,
  },
};
