import { Effect } from "effect"
import * as Schema from "@effect/schema/Schema"
import { parse } from "node-html-parser"
import { pipe } from "effect/Function"

// random page endpoint
const rand_url = "https://tmbw.net/wiki/Special:Random";

const fetch_page = Effect.tryPromise({
    try: async() => {
        const res = await fetch(rand_url);
        const html = await res.text();
        return { url: res.url, html };
    },
    catch: (err) => new Error(`Could not fetch: ${String(err)}`)
});

const rand_song: Effect.Effect<{ url: string; html: string }, Error, never> =
    pipe(
        fetch_page,
        Effect.flatMap(({ url, html }) => 
            html.includes(`<strong class="selflink">Song</strong>`)
                ? Effect.succeed({ url, html })
                : pipe(
                    Effect.sync(() => console.log(`- not a song: ${url}`)),
                    Effect.flatMap(() => rand_song)
                )
            )
    )

// song name element comes after <td class="right" id="songinfo-songname">song&nbsp;name</td>
function extract_name(html: string): string | null {
    const root = parse(html);
    const song_info = root.querySelector("td#songinfo-songname");
    const song_name = song_info?.nextElementSibling;
    return song_name?.text.trim() ?? null;
}

/* album the song is from /should/ be the first element after
 * <td class="right" id="songinfo-album">releases</td>
 * but this might be hacky
 */
function extract_album(html: string): string | null {
    const root = parse(html);
    const song_info = root.querySelector("td#songinfo-album");
    const album_name = song_info?.nextElementSibling?.querySelector("a");
    return album_name?.text.trim() ?? null;
}

const program = pipe(
    rand_song,
    Effect.map(({ url, html }) => ({ url, name: extract_name(html), album: extract_album(html) })),
    Effect.tap(({ url, name, album }) =>
        Effect.sync(() => {
            console.log(`Song!!`);
            console.log(`URL: ${url}`);
            console.log(`Song name: ${name}`);
            console.log(`Album: ${album}`);
        })
    )
);

Effect.runPromise(program);