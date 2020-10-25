
/**
 * Takes in a variable number of arrays, and "zips" them together
 * into tuples based on their index
 * ex. [1, 2, 3], [4, 5, 6] -> [[1, 4], [2, 5], [3, 6]]
 * @param {...any} rows Arrays that should be zipped into tuples
 * @return Array.<Array.<any>> An array of tuples zipped from the given rows
 */
export const zip = (...rows) => [...rows[0]].map((_,c) => rows.map(row => row[c]))

/**
 * Uses regex to remove slashes from the start and end of a given url
 * @param {string} url An relative or absolute url to trim slashes from
 * @return {string} The url with slashes trimmed
 */
export const trimSlashes = (url = '') => url.replace(/^\/+|\/+$/g, '')