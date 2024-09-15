// src/Routes/Home.tsx

import { useQuery } from "@tanstack/react-query";
import {
  getMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  IGetMoviesResult,
} from "../api";
import styled from "styled-components";
import { makeImagePath } from "../utils";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import { useState } from "react";
import { PathMatch, useMatch, useNavigate } from "react-router-dom";

// 스타일 정의
const Wrapper = styled.div`
  background-color: black;
  padding-bottom: 200px;
`;

const Loader = styled.div`
  height: 20vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Banner = styled.div<{ bgphoto: string }>`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
  background-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 1)),
    url(${(props) => props.bgphoto});
  background-size: cover;
`;

const Title = styled.h2`
  font-size: 68px;
  margin-bottom: 20px;
  color: white;
`;

const Overview = styled.p`
  font-size: 36px;
  width: 50%;
  color: white;
`;

const NextButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 20px;
  background-color: rgba(255, 255, 255, 0.7);
  color: black;
  border: none;
  cursor: pointer;
  z-index: 10; /* 버튼을 슬라이더 위에 나타나게 하기 위해 z-index 추가 */
  position: relative;
  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
`;

const SliderTitle = styled.h3`
  font-size: 24px;
  color: white;
  margin-left: 20px;
`;

const Slider = styled.div`
  position: relative;
  margin-bottom: 200px;
  top: -100px;
  z-index: 0; /* 슬라이더가 기본적으로 버튼보다 낮은 z-index */
`;

const Row = styled(motion.div)`
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(6, 1fr);
  position: absolute;
  width: 100%;
  z-index: 1; /* 슬라이더 요소는 버튼 위에 있지 않도록 z-index 설정 */
`;

const Box = styled(motion.div)<{ bgphoto: string }>`
  background-color: white;
  background-image: url(${(props) => props.bgphoto});
  background-size: cover;
  background-position: center center;
  height: 200px;
  font-size: 66px;
  cursor: pointer;
  &:first-child {
    transform-origin: center left;
  }
  &:last-child {
    transform-origin: center right;
  }
`;

const Info = styled(motion.div)`
  padding: 10px;
  background-color: ${(props) => props.theme.black.lighter};
  opacity: 0;
  position: absolute;
  width: 100%;
  bottom: 0;
  h4 {
    text-align: center;
    font-size: 18px;
    color: white;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
`;

const BigMovie = styled(motion.div)`
  position: absolute;
  width: 40vw;
  height: 80vh;
  left: 0;
  right: 0;
  margin: 0 auto;
  border-radius: 15px;
  overflow: hidden;
  background-color: ${(props) => props.theme.black.lighter};
`;

const BigCover = styled.div`
  width: 100%;
  background-size: cover;
  background-position: center center;
  height: 400px;
`;

const BigTitle = styled.h3`
  color: ${(props) => props.theme.white.lighter};
  padding: 20px;
  font-size: 46px;
  position: relative;
  top: -80px;
`;

const BigOverview = styled.p`
  padding: 20px;
  position: relative;
  top: -80px;
  color: ${(props) => props.theme.white.lighter};
`;

const rowVariants = {
  hidden: (direction: number) => ({
    x: direction > 0 ? window.outerWidth : -window.outerWidth,
  }),
  visible: {
    x: 0,
    transition: { type: "tween", duration: 1 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? window.outerWidth : -window.outerWidth,
    transition: { type: "tween", duration: 1 },
  }),
};

const boxVariants = {
  normal: {
    scale: 1,
  },
  hover: {
    scale: 1.3,
    y: -80,
    transition: {
      delay: 0.5,
      duration: 0.1,
      type: "tween",
    },
  },
};

const infoVariants = {
  hover: {
    opacity: 1,
    transition: {
      delay: 0.5,
      duration: 0.1,
      type: "tween",
    },
  },
};

const offset = 6;

function Home() {
  const navigate = useNavigate();
  const bigMovieMatch: PathMatch<string> | null = useMatch("/movies/:movieId");
  const { scrollY } = useScroll();

  // 각 영화 데이터를 받아옴
  const { data: nowPlayingData, isLoading: nowPlayingLoading } =
    useQuery<IGetMoviesResult>({
      queryKey: ["movies", "nowPlaying"],
      queryFn: getMovies,
    });

  const { data: topRatedData, isLoading: topRatedLoading } =
    useQuery<IGetMoviesResult>({
      queryKey: ["movies", "topRated"],
      queryFn: getTopRatedMovies,
    });

  const { data: upcomingData, isLoading: upcomingLoading } =
    useQuery<IGetMoviesResult>({
      queryKey: ["movies", "upcoming"],
      queryFn: getUpcomingMovies,
    });

  // 각 슬라이더에 대한 개별 인덱스 상태
  const [nowPlayingIndex, setNowPlayingIndex] = useState(0);
  const [topRatedIndex, setTopRatedIndex] = useState(0);
  const [upcomingIndex, setUpcomingIndex] = useState(0);

  const [leaving, setLeaving] = useState(false);
  const [direction, setDirection] = useState(1); // 슬라이딩 방향

  const incraseIndex = (
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    dataLength: number,
    currentIndex: number
  ) => {
    if (dataLength) {
      if (leaving) return;
      toggleLeaving();
      setDirection(1); // 오른쪽으로 슬라이딩
      const totalMovies = dataLength - 1;
      const maxIndex = Math.floor(totalMovies / offset) - 1;
      setIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
    }
  };

  const toggleLeaving = () => setLeaving((prev) => !prev);

  const onBoxClicked = (movieId: number) => {
    navigate(`/movies/${movieId}`);
  };

  const onOverlayClick = () => navigate(-1);

  const clickedMovie =
    bigMovieMatch?.params.movieId &&
    nowPlayingData?.results.find(
      (movie) => movie.id + "" === bigMovieMatch.params.movieId
    );

  return (
    <Wrapper>
      {nowPlayingLoading || topRatedLoading || upcomingLoading ? (
        <Loader>Loading...</Loader>
      ) : (
        <>
          {/* 배너 */}
          <Banner
            bgphoto={makeImagePath(
              nowPlayingData?.results[0].backdrop_path || ""
            )}
          >
            <Title>{nowPlayingData?.results[0].title}</Title>
            <Overview>{nowPlayingData?.results[0].overview}</Overview>
          </Banner>

          {/* Now Playing 슬라이더 */}
          <Slider>
            <SliderTitle>Now Playing</SliderTitle>
            <AnimatePresence
              initial={false}
              custom={direction}
              onExitComplete={toggleLeaving}
            >
              <Row
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={direction} // 슬라이딩 방향 설정
                key={nowPlayingIndex}
              >
                {nowPlayingData?.results
                  .slice(1)
                  .slice(
                    offset * nowPlayingIndex,
                    offset * nowPlayingIndex + offset
                  )
                  .map((movie) => (
                    <Box
                      layoutId={movie.id + ""}
                      key={movie.id}
                      whileHover="hover"
                      initial="normal"
                      variants={boxVariants}
                      onClick={() => onBoxClicked(movie.id)}
                      transition={{ type: "tween" }}
                      bgphoto={makeImagePath(movie.backdrop_path, "w500")}
                    >
                      <Info variants={infoVariants}>
                        <h4>{movie.title}</h4>
                      </Info>
                    </Box>
                  ))}
              </Row>
            </AnimatePresence>
            <NextButton
              onClick={() =>
                incraseIndex(
                  setNowPlayingIndex,
                  nowPlayingData?.results.length || 0,
                  nowPlayingIndex
                )
              }
            >
              다음 페이지
            </NextButton>
          </Slider>

          {/* Top Rated 슬라이더 */}
          <Slider>
            <SliderTitle>Top Rated</SliderTitle>
            <AnimatePresence
              initial={false}
              custom={direction}
              onExitComplete={toggleLeaving}
            >
              <Row
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={direction}
                key={topRatedIndex}
              >
                {topRatedData?.results
                  .slice(1)
                  .slice(
                    offset * topRatedIndex,
                    offset * topRatedIndex + offset
                  )
                  .map((movie) => (
                    <Box
                      layoutId={movie.id + ""}
                      key={movie.id}
                      whileHover="hover"
                      initial="normal"
                      variants={boxVariants}
                      onClick={() => onBoxClicked(movie.id)}
                      transition={{ type: "tween" }}
                      bgphoto={makeImagePath(movie.backdrop_path, "w500")}
                    >
                      <Info variants={infoVariants}>
                        <h4>{movie.title}</h4>
                      </Info>
                    </Box>
                  ))}
              </Row>
            </AnimatePresence>
            <NextButton
              onClick={() =>
                incraseIndex(
                  setTopRatedIndex,
                  topRatedData?.results.length || 0,
                  topRatedIndex
                )
              }
            >
              다음 페이지
            </NextButton>
          </Slider>

          {/* Upcoming 슬라이더 */}
          <Slider>
            <SliderTitle>Upcoming Movies</SliderTitle>
            <AnimatePresence
              initial={false}
              custom={direction}
              onExitComplete={toggleLeaving}
            >
              <Row
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={direction}
                key={upcomingIndex}
              >
                {upcomingData?.results
                  .slice(1)
                  .slice(
                    offset * upcomingIndex,
                    offset * upcomingIndex + offset
                  )
                  .map((movie) => (
                    <Box
                      layoutId={movie.id + ""}
                      key={movie.id}
                      whileHover="hover"
                      initial="normal"
                      variants={boxVariants}
                      onClick={() => onBoxClicked(movie.id)}
                      transition={{ type: "tween" }}
                      bgphoto={makeImagePath(movie.backdrop_path, "w500")}
                    >
                      <Info variants={infoVariants}>
                        <h4>{movie.title}</h4>
                      </Info>
                    </Box>
                  ))}
              </Row>
            </AnimatePresence>
            <NextButton
              onClick={() =>
                incraseIndex(
                  setUpcomingIndex,
                  upcomingData?.results.length || 0,
                  upcomingIndex
                )
              }
            >
              다음 페이지
            </NextButton>
          </Slider>

          <AnimatePresence>
            {bigMovieMatch ? (
              <>
                <Overlay
                  onClick={onOverlayClick}
                  exit={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
                <BigMovie
                  style={{ top: scrollY.get() + 100 }}
                  layoutId={bigMovieMatch.params.movieId}
                >
                  {clickedMovie && (
                    <>
                      <BigCover
                        style={{
                          backgroundImage: `linear-gradient(to top, black, transparent), url(${makeImagePath(
                            clickedMovie.backdrop_path,
                            "w500"
                          )})`,
                        }}
                      />
                      <BigTitle>{clickedMovie.title}</BigTitle>
                      <BigOverview>{clickedMovie.overview}</BigOverview>
                    </>
                  )}
                </BigMovie>
              </>
            ) : null}
          </AnimatePresence>
        </>
      )}
    </Wrapper>
  );
}

export default Home;
