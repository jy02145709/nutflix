import { useQuery } from "@tanstack/react-query";
import { searchMoviesAndTv, IMediaResult } from "../api";
import styled from "styled-components";
import { makeImagePath } from "../utils";
import { useLocation } from "react-router-dom";

const Wrapper = styled.div`
  padding: 20px;
  background-color: #141414;
  min-height: 100vh;
`;

const Title = styled.h2`
  font-size: 28px;
  color: white;
  margin-bottom: 20px;
`;

const ResultCount = styled.p`
  font-size: 16px;
  color: gray;
  margin-bottom: 40px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

const Box = styled.div<{ bgphoto: string }>`
  background-image: url(${(props) => props.bgphoto});
  background-size: cover;
  background-position: center center;
  height: 300px;
  border-radius: 10px;
  position: relative;
  transition: transform 0.3s ease-in-out;
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
  }
`;

const Info = styled.div`
  background-color: rgba(0, 0, 0, 0.7);
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 10px;
  color: white;
  text-align: center;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;

  ${Box}:hover & {
    opacity: 1;
  }
`;

const NoResults = styled.p`
  font-size: 24px;
  color: white;
  text-align: center;
  margin-top: 50px;
`;

function Search() {
  const location = useLocation();
  const keyword = new URLSearchParams(location.search).get("keyword");

  const { data, isLoading } = useQuery({
    queryKey: ["search", keyword],
    queryFn: () => searchMoviesAndTv(keyword || ""),
    enabled: !!keyword,
  });

  return (
    <Wrapper>
      {isLoading ? (
        <Title>Loading...</Title>
      ) : (
        <>
          {data?.results && data.results.length > 0 ? (
            <>
              <Title>Search Results for "{keyword}"</Title>
              <ResultCount>{data.results.length} results found</ResultCount>
              <Grid>
                {data.results.map((item: IMediaResult) => (
                  <Box
                    key={item.id}
                    bgphoto={makeImagePath(
                      item.backdrop_path || item.poster_path || "",
                      "w500"
                    )}
                  >
                    <Info>
                      <h4>{item.title || item.name}</h4>
                    </Info>
                  </Box>
                ))}
              </Grid>
            </>
          ) : null}
        </>
      )}
    </Wrapper>
  );
}

export default Search;
