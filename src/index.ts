import { Effect } from "effect"
import * as Schema from "@effect/schema/Schema"

// random page endpoint
const rand_url = "https://tmbw.net/wiki/Special:Random";

const fetch_page = Effect.tryPromise({
    try: async() => {
        const res = await fetch(rand_url);
        const html = await res.text();
        return { url: res.url, html };
    },
    catch: (err) => new Error(`could not fetch: ${String(err)}`)
});

const rand_song: Effect.Effect<{ url: string, html: string}, Error, never> = 
    Effect.gen(function* (_) {
        const { url, html } = yield* _(fetch_page);

        // maybe not the best way to check if the page is a song??
        if ( html.includes(`<strong class="selflink">Song</strong>`)) {
            return {url, html};
        }
        else {
            console.log(`Not a song: ${url}`);
            return yield* _(rand_song);
        }
    })

Effect.runPromise(rand_song).then(({url}) => {
    console.log(`url: ${url}`);
})